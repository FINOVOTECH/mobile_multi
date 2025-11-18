import { SafeAreaView, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, BackHandler } from 'react-native';
import React, { useEffect, useState } from 'react';
import { widthToDp, heightToDp } from "../../helpers/Responsive";
import { baseUrl } from '../../helpers/Config';
import * as Config from "../../helpers/Config"
import { useNavigation } from '@react-navigation/native';
import Rbutton from '../../components/Rbutton';

const NomineeDetails = ({
    setStatus,
    isLoading,
    setIsLoading,
    pinVerify,
}) => {
    const navigation = useNavigation();

    useEffect(() => {
        const backAction = () => {
            navigation.goBack();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, []);

    const [nominees, setNominees] = useState([
        {
            name: '',
            nomineeRelationship: '',
            dob: '',
            percentage: 100,
            mobileNumber: '',
            nomineeEmail: '',
            IdentityProofType: '',
            IdentityProofNumber: '',
            address: '',
            city:'',
            pin:''
        }
    ]);

    const relationshipOptions = ['Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Son', 'Daughter', 'Other'];
    const identityProofOptions = ['Aadhar', 'PAN', 'Passport', 'Driving License', 'Voter ID'];

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateMobile = (mobile) => {
        const mobileRegex = /^[6-9]\d{9}$/;
        return mobileRegex.test(mobile);
    };

    const validateDob = (dateStr) => {
        const dobRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!dobRegex.test(dateStr)) return false;

        const [, day, month, year] = dateStr.match(dobRegex);
        const date = new Date(year, month - 1, day);
        const today = new Date();

        return date.getDate() == day &&
            date.getMonth() == (month - 1) &&
            date.getFullYear() == year &&
            date <= today;
    };

    const handleDobChange = (text, index) => {
        let formattedText = text.replace(/\D/g, '');
        if (formattedText.length >= 3) {
            formattedText = formattedText.slice(0, 2) + '/' + formattedText.slice(2);
        }
        if (formattedText.length >= 6) {
            formattedText = formattedText.slice(0, 5) + '/' + formattedText.slice(5, 9);
        }

        const updatedNominees = [...nominees];
        updatedNominees[index].dob = formattedText;
        setNominees(updatedNominees);
    };

    const addNominee = () => {
        if (nominees.length < 2) {
            const newNominees = [...nominees, {
                name: '',
                nomineeRelationship: '',
                dob: '',
                percentage: 0,
                mobileNumber: '',
                nomineeEmail: '',
                IdentityProofType: '',
                IdentityProofNumber: '',
                address: '',
                city:'',
                pin:''
            }];

            const equalPercentage = 100 / newNominees.length;
            newNominees.forEach(nominee => {
                nominee.percentage = equalPercentage;
            });

            setNominees(newNominees);
        }
    };

    const removeNominee = (index) => {
        if (nominees.length > 1) {
            const newNominees = nominees.filter((_, i) => i !== index);
            const equalPercentage = 100 / newNominees.length;

            newNominees.forEach(nominee => {
                nominee.percentage = equalPercentage;
            });

            setNominees(newNominees);
        }
    };

    const updateNominee = (index, field, value) => {
        const updatedNominees = [...nominees];
        updatedNominees[index][field] = value;
        setNominees(updatedNominees);
    };

    const isNomineeValid = (nominee) => {
        return nominee.name.trim() !== '' &&
            nominee.nomineeRelationship !== '' &&
            validateDob(nominee.dob) &&
            validateMobile(nominee.mobileNumber) &&
            validateEmail(nominee.nomineeEmail) &&
            nominee.IdentityProofType !== '' &&
            nominee.IdentityProofNumber.trim() !== '' &&
            nominee.address.trim() !== '';
    };

    const validatePercentages = () => {
        const totalPercentage = nominees.reduce((sum, nominee) => sum + nominee.percentage, 0);
        return totalPercentage === 100;
    };

    const areAllNomineesValid = () => {
        return nominees.every(nominee => isNomineeValid(nominee));
    };

    const handleSubmitNomination = async () => {
        const invalidNominees = nominees.filter(nominee => !isNomineeValid(nominee));
        if (invalidNominees.length > 0) {
            Alert.alert('Validation Error', 'Please fill all nominee details correctly');
            return;
        }

        if (!validatePercentages()) {
            Alert.alert('Validation Error', 'Total percentage must equal 100%');
            return;
        }

        if (isLoading) return;
        setIsLoading(true);

        const payload = {
            nominations: nominees.map(nominee => ({
                ...nominee,
                dob: nominee.dob.split('/').reverse().join('-')
            }))
        };

        try {
            const response = await fetch(`${baseUrl}/api/v1/first/registration/add-nomination`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'registration-id': pinVerify
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (response.ok && data.status === "SUCCESS") {
                Alert.alert('Success', 'Nomination details submitted successfully!', [
                    {
                        text: 'OK',
                        onPress: () => setStatus(data?.nextStep || 'BANK_ADDED')
                    }
                ]);
            } else {
                const errorMessage = data.message || data.error || 'Nomination submission failed';
                Alert.alert('Submission Failed', errorMessage);
            }
        } catch (error) {
            console.error('Nomination Error:', error);
            Alert.alert('Network Error', 'Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderNomineeForm = (nominee, index) => (
        <View key={index} style={styles.nomineeContainer}>
            <View style={styles.nomineeHeader}>
                <Text style={styles.nomineeTitle}>Nominee {index + 1}</Text>
                {nominees.length > 1 && (
                    <TouchableOpacity
                        onPress={() => removeNominee(index)}
                        style={styles.removeButton}
                    >
                        <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter nominee name"
                    value={nominee.name}
                    onChangeText={(text) => updateNominee(index, 'name', text)}
                    placeholderTextColor="#999"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Relationship *</Text>
                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.horizontalOptions}>
                            {relationshipOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.optionButton,
                                        nominee.nomineeRelationship === option && styles.optionButtonSelected
                                    ]}
                                    onPress={() => updateNominee(index, 'nomineeRelationship', option)}
                                >
                                    <Text style={[
                                        styles.optionButtonText,
                                        nominee.nomineeRelationship === option && styles.optionButtonTextSelected
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
                <Text style={styles.label}>Date of Birth *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="DD/MM/YYYY"
                    value={nominee.dob}
                    onChangeText={(text) => handleDobChange(text, index)}
                    maxLength={10}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Percentage *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Percentage"
                    value={nominee.percentage.toString()}
                    onChangeText={(text) => updateNominee(index, 'percentage', parseInt(text) || 0)}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                    editable={false}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter mobile number"
                    value={nominee.mobileNumber}
                    onChangeText={(text) => updateNominee(index, 'mobileNumber', text)}
                    keyboardType="numeric"
                    maxLength={10}
                    placeholderTextColor="#999"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter email"
                    value={nominee.nomineeEmail}
                    onChangeText={(text) => updateNominee(index, 'nomineeEmail', text)}
                    keyboardType="email-address"
                    placeholderTextColor="#999"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Identity Proof Type *</Text>
                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.horizontalOptions}>
                            {identityProofOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.optionButton,
                                        nominee.IdentityProofType === option && styles.optionButtonSelected
                                    ]}
                                    onPress={() => updateNominee(index, 'IdentityProofType', option)}
                                >
                                    <Text style={[
                                        styles.optionButtonText,
                                        nominee.IdentityProofType === option && styles.optionButtonTextSelected
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
                <Text style={styles.label}>Identity Proof Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter identity proof number"
                    value={nominee.IdentityProofNumber}
                    onChangeText={(text) => updateNominee(index, 'IdentityProofNumber', text)}
                    placeholderTextColor="#999"
                />
            </View>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter City"
                    value={nominee.city}
                    onChangeText={(text) => updateNominee(index, 'city', text)}
                    placeholderTextColor="#999"

                />
            </View>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Pincode *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter pincode"
                    value={nominee.pin}
                    onChangeText={(text) => updateNominee(index, 'pin', text)}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                    maxLength={6}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter address"
                    value={nominee.address}
                    onChangeText={(text) => updateNominee(index, 'address', text)}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor="#999"
                />
            </View>
        </View>
    );

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
                            <Text style={styles.titleText}>Nominee Details</Text>
                            <Text style={styles.subtitleText}>Please provide nominee information</Text>
                        </View>

                        <View style={styles.formContainer}>
                            {nominees.map((nominee, index) => renderNomineeForm(nominee, index))}

                            {nominees.length < 2 && (
                                <TouchableOpacity
                                    style={styles.addNomineeButton}
                                    onPress={addNominee}
                                >
                                    <Text style={styles.addNomineeButtonText}>+ Add Another Nominee</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Rbutton
                            title="SUBMIT NOMINEES"
                            loading={isLoading}
                            onPress={handleSubmitNomination}
                            disabled={
                                !areAllNomineesValid() ||
                                !validatePercentages() ||
                                isLoading
                            }
                            style={[
                                // styles.submitButton,
                                (!areAllNomineesValid() || !validatePercentages() || isLoading) 
                            ]}
                            textStyle={[
                                // styles.submitButtonText,
                                (!areAllNomineesValid() || !validatePercentages() || isLoading) 
                            ]}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default NomineeDetails;

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
        // borderRadius: widthToDp(10),
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
        alignItems: 'flex-start',
        marginLeft: widthToDp(1),
        marginBottom: heightToDp(1),
    },
    titleText: {
        fontSize: widthToDp(5.5),
        fontWeight: '700',
        color: '#333',
        marginBottom: heightToDp(0.5),
    },
    subtitleText: {
        fontSize: widthToDp(3.5),
        color: '#666',
        textAlign: 'left',
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
    textArea: {
        height: heightToDp(12),
        textAlignVertical: 'top',
        paddingTop: heightToDp(1.5),
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
    nomineeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: heightToDp(2),
    },
    nomineeTitle: {
        fontSize: widthToDp(4.2),
        fontWeight: '700',
        color: '#333',
    },
    removeButton: {
        backgroundColor: '#ff4444',
        paddingVertical: heightToDp(0.5),
        paddingHorizontal: widthToDp(3),
        borderRadius: widthToDp(2),
    },
    removeButtonText: {
        color: 'white',
        fontSize: widthToDp(3),
        fontWeight: '600',
    },
    addNomineeButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Config.Colors.primary,
        borderStyle: 'dashed',
        paddingVertical: heightToDp(2),
        borderRadius: widthToDp(3),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: heightToDp(2),
    },
    addNomineeButtonText: {
        color: Config.Colors.primary,
        fontSize: widthToDp(3.8),
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: heightToDp(2),
        gap: widthToDp(3),
        width: '100%',
    },
    submitButton: {
         width: '100%',
        flex: 1,
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
         width: '100%',
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    submitButtonText: {
        color: 'white',
        fontSize: widthToDp(4),
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    disabledButtonText: {
        color: '#999',
    },
});