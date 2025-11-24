import { SafeAreaView, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Modal, Animated, StatusBar } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { widthToDp, heightToDp } from "../../helpers/Responsive";
import { baseUrl } from '../../helpers/Config';
import * as Config from "../../helpers/Config"
import { useNavigation } from '@react-navigation/native';

const BasicDetails = ({
    setKycFlow,
    isLoading,
    setIsLoading,
    errors = {},
    setErrors
}) => {
    const navigation = useNavigation();
    const [birthCountry, setBirthCountry] = useState('');
    const [placeOfBirth, setPlaceOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [grossAnnualIncome, setGrossAnnualIncome] = useState('');
    const [occupation, setOccupation] = useState('');
    const [taxStatus, setTaxStatus] = useState('');
    const [taxResident, setTaxResident] = useState('');
    const [pepStatus, setPepStatus] = useState('');

    const [showDropdown, setShowDropdown] = useState(null);
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!errors || typeof errors !== 'object') {
            setErrors({});
        }
    }, [errors, setErrors]);

    const genderOptions = ['Male', 'Female', 'Other'];
    const incomeOptions = ['Below 1 Lakh', '1-5 Lakhs', '5-10 Lakhs', '10-25 Lakhs', '25-50 Lakhs', 'Above 50 Lakhs'];
    const occupationOptions = ['Salaried', 'Self Employed', 'Business', 'Professional', 'Retired', 'Student', 'Housewife', 'Others'];
    const taxStatusOptions = ['Resident Individual', 'Non-Resident Individual', 'Hindu Undivided Family', 'Partnership Firm', 'Company', 'Others'];
    const pepStatusOptions = ['Yes', 'No'];

    const validateBirthCountry = (country) => {
        return country.trim().length >= 2 && country.trim().length <= 50;
    };

    const validatePlaceOfBirth = (place) => {
        return place.trim().length >= 2 && place.trim().length <= 100;
    };

    const validateTaxResident = (resident) => {
        return resident.trim().length >= 2 && resident.trim().length <= 50;
    };

    const handleBirthCountryChange = (text) => {
        setBirthCountry(text);
        if (text && !validateBirthCountry(text)) {
            setErrors(prev => ({ ...(prev || {}), birthCountry: 'Please enter a valid country (2-50 characters)' }));
        } else {
            setErrors(prev => ({ ...(prev || {}), birthCountry: '' }));
        }
    };

    const handlePlaceOfBirthChange = (text) => {
        setPlaceOfBirth(text);
        if (text && !validatePlaceOfBirth(text)) {
            setErrors(prev => ({ ...(prev || {}), placeOfBirth: 'Please enter a valid place (2-100 characters)' }));
        } else {
            setErrors(prev => ({ ...(prev || {}), placeOfBirth: '' }));
        }
    };

    const handleTaxResidentChange = (text) => {
        setTaxResident(text);
        if (text && !validateTaxResident(text)) {
            setErrors(prev => ({ ...(prev || {}), taxResident: 'Please enter a valid country (2-50 characters)' }));
        } else {
            setErrors(prev => ({ ...(prev || {}), taxResident: '' }));
        }
    };

    const showDropdownWithAnimation = (dropdownType) => {
        setShowDropdown(dropdownType);
        Animated.timing(slideAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const hideDropdownWithAnimation = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowDropdown(null);
        });
    };

    const handleDropdownSelect = (value, field) => {
        switch (field) {
            case 'gender':
                setGender(value);
                setErrors(prev => ({ ...(prev || {}), gender: '' }));
                break;
            case 'grossAnnualIncome':
                setGrossAnnualIncome(value);
                setErrors(prev => ({ ...(prev || {}), grossAnnualIncome: '' }));
                break;
            case 'occupation':
                setOccupation(value);
                setErrors(prev => ({ ...(prev || {}), occupation: '' }));
                break;
            case 'taxStatus':
                setTaxStatus(value);
                setErrors(prev => ({ ...(prev || {}), taxStatus: '' }));
                break;
            case 'pepStatus':
                setPepStatus(value);
                setErrors(prev => ({ ...(prev || {}), pepStatus: '' }));
                break;
        }
        hideDropdownWithAnimation();
    };

    const isFormValid = () => {
        return validateBirthCountry(birthCountry) &&
            validatePlaceOfBirth(placeOfBirth) &&
            gender &&
            grossAnnualIncome &&
            occupation &&
            taxStatus &&
            validateTaxResident(taxResident) &&
            pepStatus;
    };

    const handleSubmitBasicDetails = async () => {
        setErrors({});

        const newErrors = {};

        if (!birthCountry || !validateBirthCountry(birthCountry)) {
            newErrors.birthCountry = 'Please enter a valid birth country';
        }

        if (!placeOfBirth || !validatePlaceOfBirth(placeOfBirth)) {
            newErrors.placeOfBirth = 'Please enter a valid place of birth';
        }

        if (!gender) {
            newErrors.gender = 'Please select your gender';
        }

        if (!grossAnnualIncome) {
            newErrors.grossAnnualIncome = 'Please select your gross annual income';
        }

        if (!occupation) {
            newErrors.occupation = 'Please select your occupation';
        }

        if (!taxStatus) {
            newErrors.taxStatus = 'Please select your tax status';
        }

        if (!taxResident || !validateTaxResident(taxResident)) {
            newErrors.taxResident = 'Please enter a valid tax resident country';
        }

        if (!pepStatus) {
            newErrors.pepStatus = 'Please select your PEP status';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            Alert.alert('Validation Error', 'Please fill all fields with valid information');
            return;
        }

        setIsLoading(true);
        const payload = {
            birthCountry: "India",
            placeOfBirth: placeOfBirth.trim(),
            gender: gender,
            grossAnnualIncome: grossAnnualIncome,
            occupation: occupation,
            taxStatus: taxStatus,
            taxResisdent: taxResident.trim(),
            PEPStatus: pepStatus
        };
        console.log("Basic Details PAYLOAD::", payload);

        try {
            const response = await fetch(`${baseUrl}/api/v1/basic-details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log("Basic Details DATA:::", data);

            if (response.ok) {
                Alert.alert('Success', 'Basic details submitted successfully!');
                navigation.navigate("NextScreen");
            } else {
                Alert.alert('Error', data.message || 'Failed to submit basic details');
            }
        } catch (error) {
            console.log("Basic Details Network Error:", error);
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderDropdownButton = (value, placeholder, field, options) => (
        <TouchableOpacity
            style={[
                styles.dropdownButton,
                errors[field] && styles.inputError
            ]}
            onPress={() => showDropdownWithAnimation(field)}
        >
            <Text style={[
                styles.dropdownButtonText,
                !value && styles.placeholderText
            ]}>
                {value || placeholder}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
    );

    const renderDropdownModal = () => {
        if (!showDropdown) return null;

        let options = [];
        let title = '';

        switch (showDropdown) {
            case 'gender':
                options = genderOptions;
                title = 'Select Gender';
                break;
            case 'grossAnnualIncome':
                options = incomeOptions;
                title = 'Select Annual Income';
                break;
            case 'occupation':
                options = occupationOptions;
                title = 'Select Occupation';
                break;
            case 'taxStatus':
                options = taxStatusOptions;
                title = 'Select Tax Status';
                break;
            case 'pepStatus':
                options = pepStatusOptions;
                title = 'Are you a Politically Exposed Person?';
                break;
        }

        return (
            <Modal
                visible={showDropdown !== null}
                transparent={true}
                animationType="none"
                onRequestClose={hideDropdownWithAnimation}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        onPress={hideDropdownWithAnimation}
                        activeOpacity={1}
                    />
                    <Animated.View
                        style={[
                            styles.dropdownModalContainer,
                            {
                                transform: [{
                                    translateY: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [heightToDp(50), 0],
                                    }),
                                }],
                            }
                        ]}
                    >
                        <View style={styles.modalHandle} />
                        <Text style={styles.dropdownTitle}>{title}</Text>
                        <ScrollView style={styles.optionsContainer}>
                            {options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.optionItem}
                                    onPress={() => handleDropdownSelect(option, showDropdown)}
                                >
                                    <Text style={styles.optionText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>
        );
    };

    const safeErrors = errors || {};

    return (
        <SafeAreaView style={styles.container}>
            {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ width: "100%", paddingHorizontal: widthToDp(2) }}>

                        <View style={styles.titleContainer}>
                            <Text style={styles.titleText}>Basic Details</Text>
                            <Text style={styles.subtitleText}>Please provide your basic information</Text>
                        </View>

                        <View style={styles.formContainer}>
                            {/* <View style={styles.inputContainer}>
                <Text style={styles.label}>COUNTRY</Text>
                <TextInput
                  style={[
                    styles.input,
                    safeErrors.birthCountry && styles.inputError
                  ]}
                  placeholder="Enter birth country"
                  value={birthCountry}
                  onChangeText={handleBirthCountryChange}
                  maxLength={50}
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                />
                {safeErrors.birthCountry && <Text style={styles.errorText}>{safeErrors.birthCountry}</Text>}
              </View> */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>GENDER</Text>
                                {renderDropdownButton(gender, 'Select Gender', 'gender', genderOptions)}
                                {safeErrors.gender && <Text style={styles.errorText}>{safeErrors.gender}</Text>}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>PLACE OF BIRTH</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        safeErrors.placeOfBirth && styles.inputError
                                    ]}
                                    placeholder="Enter place of birth"
                                    value={placeOfBirth}
                                    onChangeText={handlePlaceOfBirthChange}
                                    maxLength={100}
                                    placeholderTextColor="#999"
                                    autoCapitalize="words"
                                />
                                {safeErrors.placeOfBirth && <Text style={styles.errorText}>{safeErrors.placeOfBirth}</Text>}
                            </View>



                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>GROSS ANNUAL INCOME</Text>
                                {renderDropdownButton(grossAnnualIncome, 'Select Annual Income', 'grossAnnualIncome', incomeOptions)}
                                {safeErrors.grossAnnualIncome && <Text style={styles.errorText}>{safeErrors.grossAnnualIncome}</Text>}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>OCCUPATION</Text>
                                {renderDropdownButton(occupation, 'Select Occupation', 'occupation', occupationOptions)}
                                {safeErrors.occupation && <Text style={styles.errorText}>{safeErrors.occupation}</Text>}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>TAX STATUS</Text>
                                {renderDropdownButton(taxStatus, 'Select Tax Status', 'taxStatus', taxStatusOptions)}
                                {safeErrors.taxStatus && <Text style={styles.errorText}>{safeErrors.taxStatus}</Text>}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>TAX RESIDENT</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        safeErrors.taxResident && styles.inputError
                                    ]}
                                    placeholder="Enter tax resident country"
                                    value={taxResident}
                                    onChangeText={handleTaxResidentChange}
                                    maxLength={50}
                                    placeholderTextColor="#999"
                                    autoCapitalize="words"
                                />
                                {safeErrors.taxResident && <Text style={styles.errorText}>{safeErrors.taxResident}</Text>}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>PEP STATUS</Text>
                                {renderDropdownButton(pepStatus, 'Are you a Politically Exposed Person?', 'pepStatus', pepStatusOptions)}
                                {safeErrors.pepStatus && <Text style={styles.errorText}>{safeErrors.pepStatus}</Text>}
                            </View>

                            {safeErrors.general && (
                                <Text style={styles.generalErrorText}>{safeErrors.general}</Text>
                            )}
                        </View>

                        <View style={styles.infoContainer}>
                            <Text style={styles.infoText}>
                                📋 Please ensure all information is accurate and matches your official documents
                            </Text>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[
                                styles.nextButton,
                                !isFormValid() && styles.disabledButton
                            ]}
                            onPress={handleSubmitBasicDetails}
                            disabled={!isFormValid() || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={[
                                    styles.nextButtonText,
                                    !isFormValid() && styles.disabledButtonText
                                ]}>
                                    SUBMIT DETAILS
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {renderDropdownModal()}
        </SafeAreaView>
    );
};

export default BasicDetails;

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
    keyboardAvoidingView: {
        // flex: 1,
        // borderWidth: 5, borderColor: "black",
    },
    scrollContainer: {
        // flexGrow: 1,
        // justifyContent: "space-between",
        borderWidth:1,
        borderColor:"black"
    },
    logoContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: heightToDp(3),
        marginBottom: heightToDp(1),
        gap: widthToDp(2),
    },
    logo: {
        borderRadius: widthToDp(10),
        width: widthToDp(12),
        height: heightToDp(5.5),
    },
    logoText: {
        fontSize: widthToDp(6),
        fontWeight: '700',
        color: "black",
        opacity: 0.8,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: heightToDp(2),
    },
    titleText: {
        fontSize: widthToDp(5.5),
        fontWeight: '700',
        color: '#333',
        marginBottom: heightToDp(0.5),
        // paddingHorizontal:widthToDp(2)
    },
    subtitleText: {
        fontSize: widthToDp(3.5),
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: widthToDp(8),
    },
    formContainer: {
        flex: 1,
        paddingTop: heightToDp(2),
    },
    inputContainer: {
        marginBottom: heightToDp(2),
    },
    label: {
        fontSize: widthToDp(3.5),
        fontWeight: '600',
        color: '#333',
        marginBottom: heightToDp(0.5),
    },
    input: {
        height: heightToDp(6),
        borderColor: Config.Colors.secondary,
        borderBottomWidth: 2,
        borderRadius: widthToDp(2),
        paddingHorizontal: widthToDp(4),
        fontSize: widthToDp(4),
        color: '#333',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dropdownButton: {
        height: heightToDp(6),
        borderColor: Config.Colors.secondary,
        borderBottomWidth: 2,
        borderRadius: widthToDp(2),
        paddingHorizontal: widthToDp(4),
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownButtonText: {
        fontSize: widthToDp(4),
        color: '#333',
        flex: 1,
    },
    placeholderText: {
        color: '#999',
    },
    dropdownArrow: {
        fontSize: widthToDp(3),
        color: '#666',
    },
    inputError: {
        borderColor: '#ff4444',
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
    },
    errorText: {
        color: '#ff4444',
        fontSize: widthToDp(3),
        marginTop: heightToDp(0.5),
        fontWeight: '500',
    },
    generalErrorText: {
        color: '#ff4444',
        fontSize: widthToDp(3.5),
        textAlign: 'center',
        marginTop: heightToDp(1),
        fontWeight: '600',
    },
    infoContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: widthToDp(4),
        borderRadius: widthToDp(2),
        marginTop: heightToDp(2),
    },
    infoText: {
        fontSize: widthToDp(3.5),
        color: '#666',
        textAlign: 'center',
        lineHeight: heightToDp(2.5),
    },
    buttonContainer: {
        // paddingBottom: heightToDp(2),
        // flexGrow: 1
    },
    nextButton: {
        backgroundColor: Config.Colors.secondary,
        paddingVertical: heightToDp(1.8),
        borderRadius: widthToDp(3),
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
        elevation: 0,
        shadowOpacity: 0,
    },
    nextButtonText: {
        textAlign: "center",
        fontSize: widthToDp(5),
        color: "white",
        fontWeight: '600',
    },
    disabledButtonText: {
        color: '#999999',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        flex: 1,
    },
    dropdownModalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: widthToDp(5),
        borderTopRightRadius: widthToDp(5),
        paddingBottom: heightToDp(3),
        maxHeight: heightToDp(60),
    },
    modalHandle: {
        width: widthToDp(12),
        height: heightToDp(0.6),
        backgroundColor: '#ddd',
        borderRadius: widthToDp(2),
        alignSelf: 'center',
        marginTop: heightToDp(1),
        marginBottom: heightToDp(2),
    },
    dropdownTitle: {
        fontSize: widthToDp(4.5),
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: heightToDp(2),
        paddingHorizontal: widthToDp(4),
    },
    optionsContainer: {
        paddingHorizontal: widthToDp(4),
    },
    optionItem: {
        paddingVertical: heightToDp(1.5),
        paddingHorizontal: widthToDp(4),
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    optionText: {
        fontSize: widthToDp(4),
        color: '#333',
        fontWeight: '500',
    },
});