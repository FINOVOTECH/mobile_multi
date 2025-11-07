import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import BasicDetails from './basicDetails';

const KycRegi = () => {
    const [kycFlow, setKycFlow] = useState("");
    const [isLoading,setIsLoading]=useState(false);
    const [errors,setErrors]= useState({})

    const renderKycComponent = () => {
        switch(kycFlow){
            case "basicDetails":
                return <BasicDetails
                setKycFlow={setKycFlow}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                errors={errors}
                setErrors={setErrors}
                />;
            default: 
                return <BasicDetails
                setKycFlow={setKycFlow}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                errors={errors}
                setErrors={setErrors}
                />;
        }
    }
    
    return (
      <View style={styles.container}>
          {renderKycComponent()}
      </View>
    );
}

export default KycRegi;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        // alignItems: 'center',
    },
});
