import { StyleSheet, Text, View, SafeAreaView, StatusBar, Image, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import * as Config from "../../helpers/Config";
import { heightToDp, widthToDp } from '../../helpers/Responsive';
import LoginVerify from './loginVerify';
import RegiLogin from './login';
import PanVerification from './panVerification';
import BasicDetails from './basicDetails';
import BankDetails from './bankDetails';
import NomineeDetails from './nomineeDetails';
import { useSelector } from 'react-redux';
const Registration = () => {
    const User = useSelector(state=>state.login.regi)
    const userId = useSelector(state=>state.login.regiId)
    console.log("User", User)
    const [status, setStatus] = useState(User||"");
    // const [email, setEmail] = useState('suryanshsharma414@gmail.com');
    // const [mobile, setMobile] = useState('8791971522');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');
    const [mobileOtp, setMobileOtp] = useState('');
    const [errors, setErrors] = useState({});
    const [pinVerify, setPinVerify] = useState(userId||null)
    useEffect(()=>{
        console.log("kyc status",status)
    },[status])
    const renderKyc = () => {
        switch (status) {
            case "login":
                return <RegiLogin
                    setErrors={setErrors}
                    errors={errors}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    mobile={mobile}
                    setMobile={setMobile}
                    email={email}
                    setEmail={setEmail}
                    setStatus={setStatus}
                />;
            case "loginVerify":
                return <LoginVerify
                    setErrors={setErrors}
                    errors={errors}
                    mobile={mobile}
                    email={email}
                    emailOtp={emailOtp}
                    setMobileOtp={setMobileOtp}
                    mobileOtp={mobileOtp}
                    setEmailOtp={setEmailOtp}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    setStatus={setStatus}
                    pinVerify={pinVerify}
                    setPinVerify={setPinVerify}
                />;
            case "PAN_VERIFICATION":
                return <PanVerification
                    setStatus={setStatus}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    email={email}
                    mobile={mobile}
                    setErrors={setErrors}
                    errors={errors}
                    emailOtp={emailOtp}
                    mobileOtp={mobileOtp}
                    setPinVerify={setPinVerify}
                    pinVerify={pinVerify}
                />;
            case "BASIC_DETAILS":
                return <BasicDetails
                    setStatus={setStatus}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    errors={errors}
                    setErrors={setErrors}
                    pinVerify={pinVerify}
                />
            case "NOMINEE_DETAIlS":
                return <NomineeDetails
                    setStatus={setStatus}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    pinVerify={pinVerify}
                />
            case "BANK_ADDED":
                return <BankDetails
                    setStatus={setStatus}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    errors={errors}
                    setErrors={setErrors}
                    pinVerify={pinVerify}
                />
            default:
                return <RegiLogin
                    setErrors={setErrors}
                    errors={errors}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    mobile={mobile}
                    setMobile={setMobile}
                    email={email}
                    setEmail={setEmail}
                    setStatus={setStatus}
                />;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            
            <View style={styles.content}>
                {renderKyc()}
            </View>
        </SafeAreaView>
    );
};

export default Registration;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Config.Colors.cyan_blue,
        justifyContent: "flex-start"
    },
    androidStatusBar: {
        height: StatusBar.currentHeight,
        // backgroundColor: Config.Colors.cyan_blue,
        backgroundColor: "transparent",
        // backgroundColor: "black",
    },
    content: {
        paddingHorizontal: widthToDp(4),
        height: "90%",
        width: "100%"
    },
    footer: {
        paddingBottom: heightToDp(3),
        alignItems: 'center',
    },
    footerText: {
        color: '#999',
        fontSize: widthToDp(3.5),
    },
});