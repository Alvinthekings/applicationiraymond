<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Preflight for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$response = ["success" => false, "message" => "", "action" => null];

try {
    include "db.php"; // must define $conn = new mysqli(...)

    if ($conn->connect_errno) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // Read JSON body
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        throw new Exception("Invalid JSON payload");
    }

    $signup_id        = isset($data['signup_id']) ? intval($data['signup_id']) : 0;
    $businessIdNo     = isset($data['businessIdNo']) ? trim($data['businessIdNo']) : null;
    $businessTin      = isset($data['businessTin']) ? trim($data['businessTin']) : null;
    $businessPermitNo = isset($data['businessPermitNo']) ? trim($data['businessPermitNo']) : null;
    $dateIssued       = isset($data['dateIssued']) ? trim($data['dateIssued']) : null;
    $validUntil       = isset($data['validUntil']) ? trim($data['validUntil']) : null;
    // Optional fields from OCR for businessowneraccount
    $ownerName        = isset($data['ownerName']) ? trim($data['ownerName']) : null;
    $businessName     = isset($data['businessName']) ? trim($data['businessName']) : null;
    $businessAddress  = isset($data['businessAddress']) ? trim($data['businessAddress']) : null;
    $businessLine     = isset($data['businessLine']) ? trim($data['businessLine']) : null; // Accept from dropdown
    
    // Debug: Log received business line
    error_log("📡 Received businessLine from client: " . ($businessLine ?: 'null'));
    
    // Filter out unwanted text like "NOTES"
    if ($businessAddress && strtoupper($businessAddress) === 'NOTES') {
        $businessAddress = null;
    }
    
    // Optional archiving payload
    $ocrText          = isset($data['ocrText']) ? $data['ocrText'] : null;

    // Debug logging
    error_log("Business owner data received:");
    error_log("- ownerName: " . ($ownerName ?: 'null'));
    error_log("- businessName: " . ($businessName ?: 'null'));
    error_log("- businessAddress: " . ($businessAddress ?: 'null'));
    error_log("Note: business_line will be fetched from signup table");
    $imageBase64      = isset($data['permitImageBase64']) ? $data['permitImageBase64'] : null;
    $imageExt         = isset($data['permitImageExt']) ? preg_replace('/[^a-zA-Z0-9]/', '', strtolower($data['permitImageExt'])) : null;

    if ($signup_id <= 0) {
        throw new Exception("signup_id is required");
    }

    // Verify signup exists
    $chk = $conn->prepare("SELECT signup_id FROM signup WHERE signup_id = ?");
    if (!$chk) throw new Exception("Prepare failed: " . $conn->error);
    $chk->bind_param("i", $signup_id);
    $chk->execute();
    $res = $chk->get_result();
    if ($res->num_rows === 0) {
        throw new Exception("Invalid signup_id");
    }
    $chk->close();

    // Normalize dates: accept YYYY-MM-DD or MM/DD/YYYY -> YYYY-MM-DD
    $normalizeDate = function($d) {
        if (!$d) return null;
        // If already looks like YYYY-MM-DD
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) return $d;
        // If MM/DD/YYYY
        if (preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $d)) {
            $dt = DateTime::createFromFormat('m/d/Y', $d);
            if ($dt) return $dt->format('Y-m-d');
        }
        // Try generic strtotime
        $ts = strtotime($d);
        if ($ts !== false) return date('Y-m-d', $ts);
        return null;
    };

    $dateIssued  = $normalizeDate($dateIssued);
    $validUntil  = $normalizeDate($validUntil);

    $conn->begin_transaction();

    // Check if row exists for this signup
    $exist = $conn->prepare("SELECT permit_id FROM permits WHERE signup_id = ? LIMIT 1");
    if (!$exist) throw new Exception("Prepare failed: " . $conn->error);
    $exist->bind_param("i", $signup_id);
    $exist->execute();
    $existRes = $exist->get_result();

    // Save uploaded image first so we have the path for database
    $savedImagePathRel = null;
    if ($imageBase64) {
        try {
            $storageDir = __DIR__ . DIRECTORY_SEPARATOR . 'business_permit' . DIRECTORY_SEPARATOR;
            if (!is_dir($storageDir)) {
                @mkdir($storageDir, 0777, true);
            }
            $timestamp = date('Ymd_His');
            $ext = $imageExt ?: 'jpg';
            $imageFileName = "permit_{$signup_id}_{$timestamp}.{$ext}";
            $imageAbs = $storageDir . $imageFileName;
            $decoded = base64_decode($imageBase64);
            if ($decoded !== false) {
                file_put_contents($imageAbs, $decoded);
                $savedImagePathRel = 'business_permit/' . $imageFileName;
            }
        } catch (Exception $e3) {
            error_log('Saving permit image failed: ' . $e3->getMessage());
        }
    }

    if ($existRes && $existRes->num_rows > 0) {
        // Update existing
        $row = $existRes->fetch_assoc();
        $permit_id = intval($row['permit_id']);
        $exist->close();

        $upd = $conn->prepare("UPDATE permits SET businessIdNo = ?, businessTin = ?, businessPermitNo = ?, dateIssued = ?, validUntil = ?, permit_image = ?, updated_at = NOW() WHERE permit_id = ?");
        if (!$upd) throw new Exception("Prepare failed: " . $conn->error);
        $upd->bind_param("ssssssi", $businessIdNo, $businessTin, $businessPermitNo, $dateIssued, $validUntil, $savedImagePathRel, $permit_id);
        if (!$upd->execute()) {
            throw new Exception("Failed to update permit: " . $upd->error);
        }
        $upd->close();
        $response["action"] = "updated";
    } else {
        if ($exist) $exist->close();
        // Insert new
        $ins = $conn->prepare("INSERT INTO permits (signup_id, businessIdNo, businessTin, businessPermitNo, dateIssued, validUntil, permit_image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        if (!$ins) throw new Exception("Prepare failed: " . $conn->error);
        $ins->bind_param("issssss", $signup_id, $businessIdNo, $businessTin, $businessPermitNo, $dateIssued, $validUntil, $savedImagePathRel);
        if (!$ins->execute()) {
            throw new Exception("Failed to insert permit: " . $ins->error);
        }
        $ins->close();
        $response["action"] = "inserted";
    }

    // Save OCR text to server folder if provided
    $savedTextPathRel  = null;
    if ($ocrText) {
        try {
            $storageDir = __DIR__ . DIRECTORY_SEPARATOR . 'business_permit' . DIRECTORY_SEPARATOR;
            if (!is_dir($storageDir)) {
                @mkdir($storageDir, 0777, true);
            }
            $timestamp = date('Ymd_His');
            $textFileName = "permit_{$signup_id}_{$timestamp}.txt";
            $textAbs = $storageDir . $textFileName;
            file_put_contents($textAbs, $ocrText);
            $savedTextPathRel = 'business_permit/' . $textFileName;
        } catch (Exception $e3) {
            error_log('Archiving OCR text failed: ' . $e3->getMessage());
        }
    }

    // Additionally, try to upsert business owner info if we received it
    try {
        error_log("=== BUSINESS OWNER UPSERT SECTION ===");
        error_log("Checking conditions - ownerName: " . ($ownerName ? 'YES' : 'NO'));
        error_log("Checking conditions - businessName: " . ($businessName ? 'YES' : 'NO'));
        error_log("Checking conditions - businessAddress: " . ($businessAddress ? 'YES' : 'NO'));
        
        // Use business line from client (dropdown) if provided, otherwise fetch from database
        $signupBusinessLine = $businessLine; // This comes from the dropdown selection
        
        // Only fetch from database if business line wasn't provided from dropdown
        if (!$signupBusinessLine) {
            // Try to get from existing businessowneraccount record
            if ($existingBusinessStmt = $conn->prepare("SELECT business_line FROM businessowneraccount WHERE signup_id = ?")) {
                $existingBusinessStmt->bind_param("i", $signup_id);
                $existingBusinessStmt->execute();
                $existingBusinessRes = $existingBusinessStmt->get_result();
                if ($existingBusinessRes && $existingBusinessRes->num_rows > 0) {
                    $existingBusinessRow = $existingBusinessRes->fetch_assoc();
                    $signupBusinessLine = $existingBusinessRow['business_line'] ?? null;
                    error_log("Found existing business_line in businessowneraccount: " . ($signupBusinessLine ?: 'null'));
                }
                $existingBusinessStmt->close();
            }
        } else {
            error_log("Using business_line from dropdown: " . $signupBusinessLine);
        }
        
        if ($ownerName || $businessName || $businessAddress || $signupBusinessLine) {
            
            // Only fetch from signup table if business line still wasn't found
            if (!$signupBusinessLine) {
                error_log("Business line not found in existing record, fetching from signup table...");
                
                // First check if signup table has business_line_id column
                $checkColumn = $conn->query("SHOW COLUMNS FROM signup LIKE 'business_line_id'");
                error_log("Checking if signup table has business_line_id column...");
                if ($checkColumn && $checkColumn->num_rows > 0) {
                    error_log("✓ signup table HAS business_line_id column");
                    // Use business_line_id column if it exists
                    if ($businessLineStmt = $conn->prepare("SELECT s.business_line_id, bl.line as business_line FROM signup s LEFT JOIN business_line bl ON s.business_line_id = bl.id WHERE s.signup_id = ?")) {
                        $businessLineStmt->bind_param("i", $signup_id);
                        $businessLineStmt->execute();
                        $businessLineRes = $businessLineStmt->get_result();
                        if ($businessLineRes && $businessLineRes->num_rows > 0) {
                            $businessLineRow = $businessLineRes->fetch_assoc();
                            $signupBusinessLine = $businessLineRow['business_line'] ?? null;
                            error_log("Found business_line_id: " . ($businessLineRow['business_line_id'] ?? 'null'));
                            error_log("Found business_line name: " . ($signupBusinessLine ?: 'null'));
                        } else {
                            error_log("No rows found in signup JOIN business_line query");
                        }
                        $businessLineStmt->close();
                    } else {
                        error_log("Failed to prepare business_line JOIN query: " . $conn->error);
                    }
                } else {
                    error_log("✗ signup table does NOT have business_line_id column");
                    // Fallback: try to get from signup.business_line if that column exists
                    $checkColumn2 = $conn->query("SHOW COLUMNS FROM signup LIKE 'business_line'");
                    error_log("Checking if signup table has business_line column...");
                    if ($checkColumn2 && $checkColumn2->num_rows > 0) {
                        error_log("✓ signup table HAS business_line column");
                        if ($businessLineStmt = $conn->prepare("SELECT business_line FROM signup WHERE signup_id = ?")) {
                            $businessLineStmt->bind_param("i", $signup_id);
                            $businessLineStmt->execute();
                            $businessLineRes = $businessLineStmt->get_result();
                            if ($businessLineRes && $businessLineRes->num_rows > 0) {
                                $businessLineRow = $businessLineRes->fetch_assoc();
                                $signupBusinessLine = $businessLineRow['business_line'] ?? null;
                                error_log("Found business_line from signup.business_line: " . ($signupBusinessLine ?: 'null'));
                            } else {
                                error_log("No rows found in signup.business_line query");
                            }
                            $businessLineStmt->close();
                        } else {
                            error_log("Failed to prepare signup.business_line query: " . $conn->error);
                        }
                    } else {
                        error_log("✗ signup table does NOT have business_line column either");
                    }
                }
            }
            
            error_log("Business line from signup/business_line tables: " . ($signupBusinessLine ?: 'null'));
            error_log("Owner name: " . ($ownerName ?: 'null'));
            error_log("Business name: " . ($businessName ?: 'null')); 
            error_log("Business address: " . ($businessAddress ?: 'null'));
            
            // First attempt: update by signup_id (preferred schema)
            $upd2 = $conn->prepare("UPDATE businessowneraccount SET ownername = COALESCE(?, ownername), business_name = COALESCE(?, business_name), business_address = COALESCE(?, business_address), business_line = COALESCE(?, business_line) WHERE signup_id = ?");
            if ($upd2) {
                $upd2->bind_param("ssssi", $ownerName, $businessName, $businessAddress, $signupBusinessLine, $signup_id);
                $upd2->execute();
                $affected = $upd2->affected_rows;
                $upd2->close();

                if ($affected === 0) {
                    // If no row to update, try to insert one using available info
                    // We'll fetch email and business_line from signup table
                    $email = null;
                    $insertBusinessLine = null;
                    
                    // Check if signup table has business_line_id column
                    $checkColumn = $conn->query("SHOW COLUMNS FROM signup LIKE 'business_line_id'");
                    if ($checkColumn && $checkColumn->num_rows > 0) {
                        // Use business_line_id column if it exists
                        if ($emailStmt = $conn->prepare("SELECT s.email, bl.line as business_line FROM signup s LEFT JOIN business_line bl ON s.business_line_id = bl.id WHERE s.signup_id = ?")) {
                            $emailStmt->bind_param("i", $signup_id);
                            $emailStmt->execute();
                            $emailRes = $emailStmt->get_result();
                            if ($emailRes && $emailRes->num_rows > 0) {
                                $emailRow = $emailRes->fetch_assoc();
                                $email = $emailRow['email'] ?? null;
                                $insertBusinessLine = $emailRow['business_line'] ?? null;
                            }
                            $emailStmt->close();
                        }
                    } else {
                        // Fallback: get email only, business_line will remain null
                        if ($emailStmt = $conn->prepare("SELECT email FROM signup WHERE signup_id = ?")) {
                            $emailStmt->bind_param("i", $signup_id);
                            $emailStmt->execute();
                            $emailRes = $emailStmt->get_result();
                            if ($emailRes && $emailRes->num_rows > 0) {
                                $emailRow = $emailRes->fetch_assoc();
                                $email = $emailRow['email'] ?? null;
                            }
                            $emailStmt->close();
                        }
                        
                        // Try to get business line from business_line table by guessing
                        // This is a fallback - you should really add the business_line_id column
                        error_log("Warning: signup table missing business_line_id column. Business line may not be set correctly.");
                    }

                    error_log("Inserting new businessowneraccount with business_line: " . ($insertBusinessLine ?: 'null'));

                    $ins2 = $conn->prepare("INSERT INTO businessowneraccount (signup_id, ownername, business_name, business_address, business_line, email) VALUES (?, ?, ?, ?, ?, ?)");
                    if ($ins2) {
                        $ins2->bind_param("isssss", $signup_id, $ownerName, $businessName, $businessAddress, $insertBusinessLine, $email);
                        $ins2->execute();
                        $ins2->close();
                    }
                }
            } else {
                // Fallback if schema doesn't have signup_id/ownername columns: do nothing but don't break
                error_log("businessowneraccount update skipped: schema mismatch");
            }
        }
    } catch (Exception $e2) {
        // Non-fatal for permits saving; just log
        error_log("businessowneraccount upsert failed: " . $e2->getMessage());
    }

    $conn->commit();

    $response["success"] = true;
    $response["message"] = "Permit data saved";
    $response["image_path"] = $savedImagePathRel;
    $response["text_path"]  = $savedTextPathRel;
} catch (Exception $e) {
    if (isset($conn) && $conn instanceof mysqli && $conn->connect_errno === 0) {
        $conn->rollback();
    }
    $response["success"] = false;
    $response["message"] = $e->getMessage();
    error_log("save_permit.php error: " . $e->getMessage());
}

echo json_encode($response);
