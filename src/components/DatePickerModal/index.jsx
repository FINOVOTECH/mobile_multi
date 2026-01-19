import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Config from "../../helpers/Config";

const DatePickerModal = ({ visible, onClose, children }) => {
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.container}>
          <View style={pickerStyles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={pickerStyles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
};
export default DatePickerModal;
const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  header: {
    alignItems: "flex-end",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600",
    color: Config?.Colors?.primary,
  },
});
