import { SafeAreaView, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Modal, BackHandler } from 'react-native';
import React, { useState, useEffect } from 'react';
import { widthToDp, heightToDp } from "../../helpers/Responsive";
import { baseUrl } from '../../helpers/Config';
import * as Config from "../../helpers/Config"
import { useNavigation } from '@react-navigation/native';
import Rbutton from '../../components/Rbutton';

const BasicDetails = ({
    setStatus,
    isLoading,
    setIsLoading,
    errors = {},
    setErrors,
    pinVerify
}) => {
    const navigation = useNavigation();

    const [birthCountry, setBirthCountry] = useState('India');
    const [placeOfBirth, setPlaceOfBirth] = useState('');
    const [grossAnnualIncome, setGrossAnnualIncome] = useState('');
    const [occupation, setOccupation] = useState('');
    const [taxStatus, setTaxStatus] = useState('');
    const [taxResident, setTaxResident] = useState('India');
    const [pepStatus, setPepStatus] = useState('No');
    const [showNomineeQuestion, setShowNomineeQuestion] = useState(false);
    const [clientType, setClientType] = useState('PHYSICAL');
    const [firstDPId, setFirstDPId] = useState('');
    const [secondDPId, setSecondDPId] = useState('');
    const clientTypeOptions = ['PHYSICAL', 'DEMATE'];

    const incomeOptions = ['Below 1 Lakh', '1-5 Lakhs', '5-10 Lakhs', '10-25 Lakhs', '25-50 Lakhs', 'Above 50 Lakhs'];
    const occupationOptions = ['Salaried', 'Self Employed', 'Business', 'Professional', 'Retired', 'Student', 'Housewife', 'Others'];
    const taxStatusOptions = ['INDIVIDUAL'];
    const pepOptions = ['Yes', 'No'];

    useEffect(() => {
        if (!errors || typeof errors !== 'object') {
            setErrors({});
        }
    }, [setErrors]);
    useEffect(() => {
        const backAction = () => {
            navigation.goBack();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    const isBasicDetailsValid = () => {
        const basicValid = placeOfBirth.trim() !== '' &&
            grossAnnualIncome !== '' &&
            occupation !== '' &&
            taxStatus !== '' &&
            pepStatus !== '' &&
            clientType !== '';

        if (clientType === 'DEMATE') {
            return basicValid &&
                /^\d{8}$/.test(firstDPId) &&
                /^\d{8}$/.test(secondDPId);
        }

        return basicValid;
    };

    const handleSubmitBasicDetails = async () => {
        if (!isBasicDetailsValid()) {
            Alert.alert('Validation Error', 'Please fill all required fields');
            return;
        }
        if (isLoading) return;
        setIsLoading(true);
        const payload = {
            birthCountry,
            placeOfBirth,
            grossAnnualIncome,
            occupation,
            taxStatus,
            taxResident: taxResident,
            PEPStatus: pepStatus,
            clientType,
            firstDPId: clientType === 'DEMATE' ? firstDPId : '',
            secondDPId: clientType === 'DEMATE' ? secondDPId : ''
        };
        console.log("Basic Details Payload:", payload);
        try {
            const response = await fetch(`${baseUrl}/api/v1/first/registration/basic-details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'registration-id': pinVerify
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log("Basic Details Response:", data);
            if (response.ok && data.status === "SUCCESS") {
                setTimeout(() => {
                    setShowNomineeQuestion(true);
                }, 100);
            } else {
                const errorMessage = data.message || data.error || 'Basic details submission failed';
                Alert.alert('Submission Failed', errorMessage);
            }
        } catch (error) {
            console.error('Basic Details Error:', error);
            Alert.alert('Network Error', 'Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkipNomination = () => {
        setShowNomineeQuestion(false);
        Alert.alert('Success', 'Basic details submitted successfully!', [
            {
                text: 'OK',
                onPress: () => setStatus("BANK_ADDED")
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
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
                    <View>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require("../../assets/images/logo.png")}
                                style={styles.logo}
                                resizeMode='contain'
                            />
                            <Text style={styles.logoText}>Jyoti MF</Text>
                        </View>

                        <View style={styles.titleContainer}>
                            <Text style={styles.subtitleText}>Please provide your basic information</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Place of Birth *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter place of birth"
                                    value={placeOfBirth}
                                    onChangeText={setPlaceOfBirth}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Annual Income *</Text>
                                <View>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.horizontalOptions}>
                                            {incomeOptions.map((option) => (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={[
                                                        styles.optionButton,
                                                        grossAnnualIncome === option && styles.optionButtonSelected
                                                    ]}
                                                    onPress={() => setGrossAnnualIncome(option)}
                                                >
                                                    <Text style={[
                                                        styles.optionButtonText,
                                                        grossAnnualIncome === option && styles.optionButtonTextSelected
                                                    ]}>
                                                        {option}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Occupation *</Text>
                                <View>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.horizontalOptions}>
                                            {occupationOptions.map((option) => (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={[
                                                        styles.optionButton,
                                                        occupation === option && styles.optionButtonSelected
                                                    ]}
                                                    onPress={() => setOccupation(option)}
                                                >
                                                    <Text style={[
                                                        styles.optionButtonText,
                                                        occupation === option && styles.optionButtonTextSelected
                                                    ]}>
                                                        {option}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Tax Status *</Text>
                                <View>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.horizontalOptions}>
                                            {taxStatusOptions.map((option) => (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={[
                                                        styles.optionButton,
                                                        taxStatus === option && styles.optionButtonSelected
                                                    ]}
                                                    onPress={() => setTaxStatus(option)}
                                                >
                                                    <Text style={[
                                                        styles.optionButtonText,
                                                        taxStatus === option && styles.optionButtonTextSelected
                                                    ]}>
                                                        {option}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Client Type *</Text>
                                <View style={styles.pepContainer}>
                                    {clientTypeOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={[
                                                styles.pepOption,
                                                clientType === option && styles.pepOptionSelected
                                            ]}
                                            onPress={() => setClientType(option)}
                                        >
                                            <Text style={[
                                                styles.pepOptionText,
                                                clientType === option && styles.pepOptionTextSelected
                                            ]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {clientType === 'DEMATE' && (
                                <>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>First DP ID *</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter First DP ID (8 digits)"
                                            keyboardType="numeric"
                                            maxLength={8}
                                            value={firstDPId}
                                            onChangeText={setFirstDPId}
                                            placeholderTextColor="#999"
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Second DP ID *</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter Second DP ID (8 digits)"
                                            keyboardType="numeric"
                                            maxLength={8}
                                            value={secondDPId}
                                            onChangeText={setSecondDPId}
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                </>
                            )}

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>PEP Status *</Text>
                                <View style={styles.pepContainer}>
                                    {pepOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={[
                                                styles.pepOption,
                                                pepStatus === option && styles.pepOptionSelected
                                            ]}
                                            onPress={() => setPepStatus(option)}
                                        >
                                            <Text style={[
                                                styles.pepOptionText,
                                                pepStatus === option && styles.pepOptionTextSelected
                                            ]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Rbutton
                            title="SUBMIT DETAILS"
                            loading={isLoading}
                            onPress={handleSubmitBasicDetails}
                            disabled={!isBasicDetailsValid() || isLoading}
                            style={[
                                // styles.nextButton,
                                (!isBasicDetailsValid() || isLoading)
                            ]}
                            textStyle={[
                                // styles.nextButtonText,
                                (!isBasicDetailsValid() || isLoading)
                            ]}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={showNomineeQuestion}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowNomineeQuestion(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        onPress={() => setShowNomineeQuestion(false)}
                    />
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Add Nominee</Text>
                            <Text style={styles.modalSubtitle}>Do you want to add a nominee to your account?</Text>

                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonSecondary]}
                                    onPress={handleSkipNomination}
                                >
                                    <Text style={styles.modalButtonTextSecondary}>Skip</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={() => {
                                        setShowNomineeQuestion(false);
                                        setStatus("NOMINEE_DETAIlS")
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>Yes, Add Nominee</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default BasicDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Config.Colors.cyan_blue,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "space-between",
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
        marginBottom: heightToDp(3),
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
        marginBottom: heightToDp(2.5),
    },
    label: {
        fontSize: widthToDp(3.5),
        fontWeight: '600',
        color: '#333',
        marginBottom: heightToDp(0.5),
    },
    input: {
        height: heightToDp(6),
        borderColor: Config.Colors.primary,
        borderBottomWidth: 2,
        borderRadius: widthToDp(2),
        paddingHorizontal: widthToDp(4),
        fontSize: widthToDp(4),
        color: '#333',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    horizontalOptions: {
        flexDirection: 'row',
        paddingVertical: heightToDp(1),
    },
    optionButton: {
        paddingVertical: heightToDp(1),
        paddingHorizontal: widthToDp(3),
        borderWidth: 1,
        borderColor: Config.Colors.primary,
        borderRadius: widthToDp(2),
        marginRight: widthToDp(2),
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    optionButtonSelected: {
        backgroundColor: Config.Colors.primary,
    },
    optionButtonText: {
        fontSize: widthToDp(3.2),
        color: '#333',
        fontWeight: '500',
    },
    optionButtonTextSelected: {
        color: 'white',
        fontWeight: '600',
    },
    pepContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: heightToDp(0.5),
    },
    pepOption: {
        flex: 1,
        paddingVertical: heightToDp(1.2),
        paddingHorizontal: widthToDp(3),
        borderWidth: 2,
        borderColor: Config.Colors.primary,
        borderRadius: widthToDp(2),
        marginHorizontal: widthToDp(1),
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    pepOptionSelected: {
        backgroundColor: Config.Colors.primary,
    },
    pepOptionText: {
        textAlign: 'center',
        fontSize: widthToDp(3.5),
        fontWeight: '600',
        color: '#333',
    },
    pepOptionTextSelected: {
        color: 'white',
    },
    buttonContainer: {
        paddingBottom: heightToDp(2),
    },
    nextButton: {
        backgroundColor: Config.Colors.primary,
        paddingVertical: heightToDp(1.8),
        borderRadius: widthToDp(3),
        alignItems: 'center',
        justifyContent: 'center',
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
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    nextButtonText: {
        color: 'white',
        fontSize: widthToDp(4),
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    disabledButtonText: {
        color: '#999',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: widthToDp(5),
        borderTopRightRadius: widthToDp(5),
        maxHeight: '90%',
        height: 'auto',
    },
    modalHandle: {
        width: widthToDp(10),
        height: heightToDp(0.5),
        backgroundColor: '#ccc',
        borderRadius: widthToDp(2),
        alignSelf: 'center',
        marginTop: heightToDp(1),
    },
    modalContent: {
        padding: widthToDp(5),
        flex: 1,
        paddingBottom: heightToDp(2),
    },
    modalTitle: {
        fontSize: widthToDp(5),
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: heightToDp(1),
    },
    modalSubtitle: {
        fontSize: widthToDp(3.5),
        color: '#666',
        textAlign: 'center',
        marginBottom: heightToDp(3),
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingTop: heightToDp(2),
        gap: widthToDp(3),
    },
    modalButton: {
        flex: 1,
        backgroundColor: Config.Colors.primary,
        paddingVertical: heightToDp(1.5),
        borderRadius: widthToDp(3),
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Config.Colors.primary,
    },
    modalButtonText: {
        color: 'white',
        fontSize: widthToDp(3.8),
        fontWeight: '600',
    },
    modalButtonTextSecondary: {
        color: Config.Colors.primary,
        fontSize: widthToDp(3.8),
        fontWeight: '600',
    },
});