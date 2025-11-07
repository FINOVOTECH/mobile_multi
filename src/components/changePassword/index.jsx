import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { widthToDp, heightToDp } from '../../helpers/Responsive'; // Adjust import path as needed
import SInfoSvg from '../../presentation/svgs';
import * as Config from "../../helpers/Config"
import { useDispatch, useSelector } from 'react-redux';
import { setBiometricPin } from '../../store/slices/loginSlice';
import Rbutton from '../Rbutton';
const ChangePassword = ({ navigation }) => {
    const dispatch = useDispatch();
    const [newPassword, setNewPassword] = useState(['', '', '', '']);
    const [confirmPassword, setConfirmPassword] = useState(['', '', '', '']);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const newPasswordRefs = useRef([]);
    const confirmPasswordRefs = useRef([]);

    const handlePasswordChange = (text, index, passwordType) => {
        if (text.length > 1) return; 

        const newPasswordArray = [...(passwordType === 'new' ? newPassword : confirmPassword)];
        newPasswordArray[index] = text;

        if (passwordType === 'new') {
            setNewPassword(newPasswordArray);
        } else {
            setConfirmPassword(newPasswordArray);
        }

        // Auto-focus next input
        if (text && index < 3) {
            const refs = passwordType === 'new' ? newPasswordRefs : confirmPasswordRefs;
            refs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index, passwordType) => {
        if (e.nativeEvent.key === 'Backspace' && index > 0) {
            const currentValue = passwordType === 'new' ? newPassword[index] : confirmPassword[index];

            if (!currentValue) {
                const refs = passwordType === 'new' ? newPasswordRefs : confirmPasswordRefs;
                refs.current[index - 1]?.focus();
            }
        }
    };

    const validatePasswords = () => {
        const newErrors = {};

        // Check if new password is complete
        if (newPassword.some(digit => !digit)) {
            newErrors.new = 'Please enter complete new password';
        }

        // Check if confirm password is complete
        if (confirmPassword.some(digit => !digit)) {
            newErrors.confirm = 'Please enter complete confirm password';
        }

        // Check if new passwords match
        if (newPassword.join('') !== confirmPassword.join('') &&
            !newPassword.some(digit => !digit) &&
            !confirmPassword.some(digit => !digit)) {
            newErrors.match = 'New passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validatePasswords()) {
            const newPass = newPassword.join('');

dispatch(setBiometricPin(newPass));
            Alert.alert(
                'Success',
                'Password changed successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setNewPassword(['', '', '', '']);
                            setConfirmPassword(['', '', '', '']);
                            setErrors({});
                            navigation.goBack(); // Navigate back after successful change
                        }
                    }
                ]
            );

            console.log('New Password:', newPass);
        }
    };

    const renderPasswordInputs = (password, refs, passwordType, label, showPassword, toggleShow) => (
        <View style={styles.passwordSection}>
            <View style={styles.labelContainer}>
                <Text style={styles.label}>{label}</Text>
                <TouchableOpacity onPress={toggleShow} style={styles.eyeIcon}>
                    <Text style={styles.eyeText}>{showPassword ? '👁️' : '🔒'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.passwordContainer}>
                {password.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={ref => refs.current[index] = ref}
                        style={[
                            styles.digitInput,
                            errors[passwordType] && styles.errorInput
                        ]}
                        value={digit}
                        onChangeText={text => handlePasswordChange(text, index, passwordType)}
                        onKeyPress={e => handleKeyPress(e, index, passwordType)}
                        keyboardType="numeric"
                        maxLength={1}
                        secureTextEntry={!showPassword}
                        textAlign="center"
                    />
                ))}
            </View>

            {/* <Text style={styles.helperText}>4 digits</Text> */}

            {errors[passwordType] && (
                <Text style={styles.errorText}>{errors[passwordType]}</Text>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <SInfoSvg.BackButton />
                    </TouchableOpacity>
                    <Text style={styles.title}>Change Password</Text>
                </View>

                <View style={styles.formContainer}>
                    {renderPasswordInputs(
                        newPassword,
                        newPasswordRefs,
                        'new',
                        'New Password',
                        showNewPassword,
                        () => setShowNewPassword(!showNewPassword)
                    )}

                    {renderPasswordInputs(
                        confirmPassword,
                        confirmPasswordRefs,
                        'confirm',
                        'Confirm New Password',
                        showConfirmPassword,
                        () => setShowConfirmPassword(!showConfirmPassword)
                    )}

                    {errors.match && (
                        <Text style={styles.errorText}>{errors.match}</Text>
                    )}

                    <View style={styles.infoContainer}>
                        <View style={styles.infoIcon}>
                            <Text style={styles.infoIconText}>ℹ️</Text>
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoText}>PIN must be exactly 4 digits.</Text>
                            {/* <Text style={styles.infoText}>PIN should not be easily guessable (avoid 1234, 0000, etc.).</Text> */}
                            <Text style={styles.infoText}>PIN must not contain your birth year or phone digits.</Text>
                            <Text style={styles.infoText}>PIN must be different from previous PIN</Text>
                        </View>
                    </View>

                </View>
                <View style={{ alignItems: "center" , marginVertical: heightToDp(4) }}>
                    {/* <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitButtonText}>SUBMIT</Text>
                    </TouchableOpacity> */}
                    <Rbutton
                    title={'SUBMIT'}
                    onPress={handleSubmit}
                    style={{width:"100%"}}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Config.Colors.cyan_blue,
    },
    androidStatusBar: {
        height: StatusBar.currentHeight,
        // backgroundColor: Config.Colors.cyan_blue,
        backgroundColor: "transparent",
        // backgroundColor: "black",
    },
    scrollContainer: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: widthToDp(4),
        paddingVertical: heightToDp(2),
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButton: {
        marginRight: widthToDp(4),
    },
    backArrow: {
        fontSize: widthToDp(6),
        color: '#333',
    },
    title: {
        fontSize: widthToDp(5),
        fontWeight: '600',
        color: '#333',
    },
    formContainer: {
        flex: 1,
        gap:heightToDp(4),
        paddingHorizontal: widthToDp(4),
    },
    passwordSection: {
        // borderWidth:1
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // borderWidth:1
    },
    label: {
        fontSize: widthToDp(4),
        color: '#666',
        fontWeight: '500',
    },
    eyeIcon: {
        padding: widthToDp(2),
    },
    eyeText: {
        fontSize: widthToDp(5),
    },
    passwordContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: widthToDp(2),
        // borderWidth:1
    },
    digitInput: {
        width: widthToDp(12),
        // height: widthToDp(12),
        fontSize: widthToDp(4),
        fontWeight: 'bold',
        color: '#333',
        backgroundColor: 'transparent',
        // borderWidth: 1,
        borderBottomWidth: 1,
        textAlign: 'center',
    },
    errorInput: {
        color: '#ff4444',
    },
    helperText: {
        fontSize: widthToDp(3.5),
        color: '#999',
        marginTop: heightToDp(0.5),
        marginLeft: widthToDp(2),
    },
    errorText: {
        color: '#ff4444',
        fontSize: widthToDp(3.5),
        marginTop: heightToDp(0.5),
        marginLeft: widthToDp(2),
    },
    infoContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff3cd',
        padding: widthToDp(4),
        borderRadius: widthToDp(2),
        marginVertical: heightToDp(3),
        borderLeftWidth: 4,
        borderLeftColor: '#ffc107',
    },
    infoIcon: {
        marginRight: widthToDp(3),
    },
    infoIconText: {
        fontSize: widthToDp(4),
        color: '#856404',
    },
    infoTextContainer: {
        flex: 1,
    },
    infoText: {
        fontSize: widthToDp(3.5),
        color: '#856404',
        lineHeight: widthToDp(5),
        marginBottom: heightToDp(0.5),
    },
    submitButton: {
        backgroundColor: Config.Colors.secondary,
        paddingVertical: heightToDp(2),
        borderRadius: 50,
        // margin:widthToDp(2),
        width: "90%"
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: widthToDp(4.5),
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 1,
    },
});

export default ChangePassword;