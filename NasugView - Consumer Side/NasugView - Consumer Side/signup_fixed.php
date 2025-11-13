<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

include "db.php";

$response = ["success" => false, "message" => ""];

try {
    // Get form data (multipart/form-data for file upload)
    $email = $_POST['email'] ?? '';
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? 'consumer';
    $business_line_id = $_POST['business_line_id'] ?? null;

    // Validate required fields
    if (empty($email) || empty($username) || empty($password)) {
        $response["message"] = "Email, username, and password are required.";
        echo json_encode($response);
        exit;
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response["message"] = "Invalid email format.";
        echo json_encode($response);
        exit;
    }

    // Check if email already exists
    $checkEmail = $conn->prepare("SELECT signup_id FROM signup WHERE email = ?");
    if (!$checkEmail) {
        throw new Exception("Database error: " . $conn->error);
    }
    $checkEmail->bind_param("s", $email);
    $checkEmail->execute();
    $result = $checkEmail->get_result();
    
    if ($result->num_rows > 0) {
        $response["message"] = "Email already exists.";
        echo json_encode($response);
        exit;
    }

    // Check if username already exists
    $checkUsername = $conn->prepare("SELECT signup_id FROM signup WHERE username = ?");
    if (!$checkUsername) {
        throw new Exception("Database error: " . $conn->error);
    }
    $checkUsername->bind_param("s", $username);
    $checkUsername->execute();
    $result = $checkUsername->get_result();
    
    if ($result->num_rows > 0) {
        $response["message"] = "Username already exists.";
        echo json_encode($response);
        exit;
    }

    // Start transaction
    $conn->begin_transaction();

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // Insert into signup table
    $signupStmt = $conn->prepare("INSERT INTO signup (email, username, password, role, profile_pic) VALUES (?, ?, ?, ?, ?)");
    if (!$signupStmt) {
        throw new Exception("Database error: " . $conn->error);
    }
    
    $default_profile_pic = "default.png";
    $signupStmt->bind_param("sssss", $email, $username, $hashedPassword, $role, $default_profile_pic);
    
    if (!$signupStmt->execute()) {
        throw new Exception("Failed to create user account: " . $signupStmt->error);
    }
    
    $signup_id = $conn->insert_id;

    // If user is business owner, handle business permit file upload
    if (strtolower($role) === 'business_owner') {
        
        // Handle file upload if present
        $permit_file_path = null;
        if (isset($_FILES['business_permit']) && $_FILES['business_permit']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['business_permit'];
            $upload_dir = 'uploads/business_permits/';
            
            // Create directory if it doesn't exist
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            // Generate unique filename
            $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $new_filename = 'permit_' . $signup_id . '_' . time() . '.' . $file_extension;
            $target_path = $upload_dir . $new_filename;
            
            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $target_path)) {
                $permit_file_path = $target_path;
                
                // Save file path to signup table
                $updatePermit = $conn->prepare("UPDATE signup SET business_permit_file = ? WHERE signup_id = ?");
                if ($updatePermit) {
                    $updatePermit->bind_param("si", $permit_file_path, $signup_id);
                    $updatePermit->execute();
                }
            }
        }

    // Insert into businessowneraccount table with business_line_id
        if (!empty($business_line_id)) {
            // First, check if businessowneraccount table exists and what columns it has
            // This is a safe insert that only uses columns that should exist
            
            // Try to get business line name
            $business_line_name = '';
            // Fixed table/column names: business_line(id, line)
            $getBusinessLine = $conn->prepare("SELECT line FROM business_line WHERE id = ?");
            if ($getBusinessLine) {
                $getBusinessLine->bind_param("i", $business_line_id);
                $getBusinessLine->execute();
                $businessLineResult = $getBusinessLine->get_result();
                
                if ($businessLineResult->num_rows > 0) {
                    $row = $businessLineResult->fetch_assoc();
                    $business_line_name = $row['line'];
                }
                $getBusinessLine->close();
            }

            // Insert into businessowneraccount - adjust columns based on your actual table structure
            // Common columns: signup_id, business_line_id, business_line, email
            $businessStmt = $conn->prepare("INSERT INTO businessowneraccount (signup_id, business_line_id, business_line, email) VALUES (?, ?, ?, ?)");
            
            if (!$businessStmt) {
                // If the above query fails, try with fewer columns
                $businessStmt = $conn->prepare("INSERT INTO businessowneraccount (signup_id, email) VALUES (?, ?)");
                if (!$businessStmt) {
                    throw new Exception("Database error on businessowneraccount insert: " . $conn->error);
                }
                $businessStmt->bind_param("is", $signup_id, $email);
            } else {
                $businessStmt->bind_param("iiss", $signup_id, $business_line_id, $business_line_name, $email);
            }
            
            if (!$businessStmt->execute()) {
                throw new Exception("Failed to save business data: " . $businessStmt->error);
            }
            $businessStmt->close();
        }

        // Ensure a permits row exists for this business owner right away
        // so OCR can simply update it later even if extraction fails at signup time.
        try {
            $seedStmt = $conn->prepare("SELECT permit_id FROM permits WHERE signup_id = ?");
            if ($seedStmt) {
                $seedStmt->bind_param("i", $signup_id);
                $seedStmt->execute();
                $seedRes = $seedStmt->get_result();
                $seedStmt->close();

                if ($seedRes->num_rows === 0) {
                    $insPermit = $conn->prepare("INSERT INTO permits (signup_id, created_at, updated_at) VALUES (?, NOW(), NOW())");
                    if ($insPermit) {
                        $insPermit->bind_param("i", $signup_id);
                        $insPermit->execute();
                        $insPermit->close();
                    }
                }
            }
        } catch (Exception $e) {
            // Non-fatal: continue without blocking signup
            error_log("Permit seed insert failed for signup_id {$signup_id}: " . $e->getMessage());
        }

        // Also store the uploaded permit file as BLOB into the database (permits.permit_image)
        try {
            if (!empty($permit_file_path) && is_file($permit_file_path)) {
                $blobData = @file_get_contents($permit_file_path);
                if ($blobData !== false) {
                    // If a permits row now exists, update it; otherwise insert a new row with the blob
                    $checkPerm = $conn->prepare("SELECT permit_id FROM permits WHERE signup_id = ? LIMIT 1");
                    if ($checkPerm) {
                        $checkPerm->bind_param("i", $signup_id);
                        $checkPerm->execute();
                        $permRes = $checkPerm->get_result();
                        $checkPerm->close();

                        if ($permRes && $permRes->num_rows > 0) {
                            // Update existing row
                            $updBlob = $conn->prepare("UPDATE permits SET permit_image = ?, updated_at = NOW() WHERE signup_id = ?");
                            if ($updBlob) {
                                $null = NULL; // placeholder for blob binding
                                $updBlob->bind_param("bi", $null, $signup_id);
                                $updBlob->send_long_data(0, $blobData);
                                $updBlob->execute();
                                $updBlob->close();
                            }
                        } else {
                            // Insert new row with blob if none exists for some reason
                            $insBlob = $conn->prepare("INSERT INTO permits (signup_id, permit_image, created_at, updated_at) VALUES (?, ?, NOW(), NOW())");
                            if ($insBlob) {
                                $null = NULL;
                                $insBlob->bind_param("ib", $signup_id, $null);
                                $insBlob->send_long_data(1, $blobData);
                                $insBlob->execute();
                                $insBlob->close();
                            }
                        }
                    }
                }
            }
        } catch (Exception $e) {
            // Non-fatal; keep signup flow resilient
            error_log("Storing permit image blob during signup failed for signup_id {$signup_id}: " . $e->getMessage());
        }
    }

    // Commit transaction
    $conn->commit();
    
    $response["success"] = true;
    $response["message"] = "Registration successful!";
    $response["signup_id"] = $signup_id;
    
} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn) && $conn->ping()) {
        $conn->rollback();
    }
    $response["message"] = $e->getMessage();
    error_log("Signup error: " . $e->getMessage());
}

echo json_encode($response);
if (isset($conn)) {
    $conn->close();
}
?>
