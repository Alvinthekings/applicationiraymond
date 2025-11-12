 import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { BASE_URL } from '../utils/api';
const API_URL = `${BASE_URL}/`;

    export default function SettingsScreen({ navigation }: any) {
    const [userId, setUserId] = useState<string | null>(null);
    const [fname, setFname] = useState('');
    const [lname, setLname] = useState('');
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        const loadUserData = async () => {
        const id = await AsyncStorage.getItem('user_id');
        if (!id) {
            Alert.alert('Error', 'User not logged in.');
            return;
        }
        setUserId(id);

        try {
            const res = await fetch(`${API_URL}get_user_info.php?id=${id}`);
            const data = await res.json();
            if (data.success) {
            setFname(data.user.fname || '');
            setLname(data.user.lname || '');
            setGender(data.user.gender || '');
            setAge(data.user.age || '');
            setPhone(data.user.phone || '');
            setAddress(data.user.address || '');
            } else {
            Alert.alert('Error', data.message);
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
            Alert.alert('Network Error', 'Failed to connect to the server.');
        }
        };
        loadUserData();
    }, []);

    const handleSave = async () => {
        if (!userId) return;
        try {
        const res = await fetch(`${API_URL}update_user_info.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            id: userId,
            fname,
            lname,
            gender,
            age,
            phone,
            address,
            }),
        });
        const data = await res.json();
        if (data.success) {
            Alert.alert('Success', 'Profile updated successfully!');
        } else {
            Alert.alert('Error', data.message || 'Update failed');
        }
        } catch (err) {
        console.error('Error saving user data:', err);
        Alert.alert('Network Error', 'Could not update profile.');
        }
    };

    return (
        <ScrollView style={styles.container}>
        

        <View style={styles.form}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            value={fname}
            onChangeText={setFname}
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            value={lname}
            onChangeText={setLname}
            />

            <Text style={styles.label}>Age</Text>
            <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
            <TouchableOpacity
                style={[styles.genderOption, gender === 'Male' && styles.genderSelected]}
                onPress={() => setGender('Male')}
            >
                <Text style={[styles.genderText, gender === 'Male' && styles.genderTextSelected]}>
                Male
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.genderOption, gender === 'Female' && styles.genderSelected]}
                onPress={() => setGender('Female')}
            >
                <Text style={[styles.genderText, gender === 'Female' && styles.genderTextSelected]}>
                Female
                </Text>
            </TouchableOpacity>
            </View>

            <Text style={styles.label}>Phone</Text>
            <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={setPhone}
            />

            <Text style={styles.label}>Address</Text>
            <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Enter your address"
            value={address}
            onChangeText={setAddress}
            multiline
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
    );
    }

    const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    form: { padding: 20 },
    label: { fontSize: 14, color: '#333', marginBottom: 6, marginTop: 15, fontWeight: '600' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#000',
    },
    genderContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    genderOption: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        paddingVertical: 10,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    genderSelected: { backgroundColor: '#008000', borderColor: '#008000' },
    genderText: { color: '#333', fontSize: 16 },
    genderTextSelected: { color: '#fff', fontWeight: '600' },
    saveButton: {
        backgroundColor: '#008000',
        paddingVertical: 14,
        borderRadius: 10,
        marginTop: 30,
        alignItems: 'center',
    },
    saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    });



