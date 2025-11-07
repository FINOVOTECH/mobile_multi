import { Image, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native'
import * as Config from "../../../helpers/Config"
import * as Icons from "../../../helpers/Icons"
import LottieView from 'lottie-react-native';
import { widthToDp, heightToDp } from "../../../helpers/Responsive"
import React from 'react'
import CommonHeader from '../../../components/CommonHeader';

const Mandate = () => {
  return (
    <Modal
      visible={showMandateModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowMandateModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowMandateModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <View style={styles.mandateModalContainer}>
              <View style={styles.mandateModalHeader}>
                <Text style={styles.mandateModalTitle}>Select Mandate</Text>
                <TouchableOpacity onPress={() => setShowMandateModal(false)}>
                  <Text style={styles.mandateModalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.mandateList}>
                {mandateOptions.map((mandate) => (
                  <TouchableOpacity
                    key={mandate.id}
                    style={[
                      styles.mandateOption,
                      selectedMandate?.id === mandate.id && styles.selectedMandateOption
                    ]}
                    onPress={() => handleMandateSelect(mandate)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.mandateLogo, { backgroundColor: mandate.bgColor }]}>
                      <Text style={styles.mandateLogoText}>{mandate.logo}</Text>
                    </View>
                    <View style={styles.mandateDetails}>
                      <Text style={styles.mandateId}>{mandate.mandateId}</Text>
                      <Text style={styles.mandateAmount}>Amount: ₹{mandate.amount?.toFixed(2)}</Text>
                      <Text style={styles.mandateBankInfo}>
                        Registration Date: {mandate.registrationDate}
                      </Text>
                      <Text style={styles.mandateBankInfo}>
                        Approved Date: {mandate.approvedDate}
                      </Text>
                      <Text style={styles.mandateBankName}>Bank Name: {mandate.bankName}</Text>
                    </View>
                    {selectedMandate?.id === mandate.id && (
                      <View style={styles.mandateCheckmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const MandateResponse = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* <CommonHeader
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      /> */}
      <Text style={styles.title}>MandateResponse</Text>
      <View>
        {/* <Image
        // source={require(Icons.mandate_loader)}
        source={require("../../../assets/gif/mandateLoader.gif")}
        style={styles.gif}
      /> */}
        <LottieView
          source={require('../../../assets/gif/loader.json')}
          autoPlay
          loop={true} // set true if you want it to repeat
          style={styles.lottie}
        />
      </View>
    </SafeAreaView>
  )
}

export default MandateResponse;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    // backgroundColor: Config.Colors.cyan_blue,
    backgroundColor: "transparent",
    // backgroundColor: "black",
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  gif: {
    width: 200,
    height: 200,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  //Modal Styles

  // Mandate Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  mandateModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: widthToDp(5),
    borderTopRightRadius: widthToDp(5),
    maxHeight: heightToDp * 0.7,
  },
  mandateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mandateModalTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '600',
    color: '#333333',
  },
  mandateModalClose: {
    fontSize: widthToDp(5),
    color: '#666666',
    paddingHorizontal: widthToDp(2),
    paddingVertical: widthToDp(1),
  },
  mandateList: {
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1),
  },
  mandateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightToDp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  selectedMandateOption: {
    backgroundColor: '#f8f9ff',
  },
  mandateCheckmark: {
    width: widthToDp(5),
    height: widthToDp(5),
    borderRadius: widthToDp(2.5),
    backgroundColor: Config.Colors?.primary || '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: widthToDp(2),
  },
  checkmarkText: {
    fontSize: widthToDp(3),
    color: '#ffffff',
    fontWeight: 'bold',
  },
});