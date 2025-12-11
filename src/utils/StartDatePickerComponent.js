import React from 'react';
import {
  Modal,
  Platform,
  TouchableWithoutFeedback,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const StartDatePickerComponent = ({
  showDatePicker,
  setShowDatePicker,
  selectedDate,
  setSelectedDate,
  minimumDate,
  maximumDate,
  investmentType,
  setErrors,

  // styles passed from parent
  modalOverlay,
  iosDatePickerContainer,
  datePickerHeader,
  datePickerButtonText,
  datePickerTitle,
  doneButton,
}) => {
  // ---------- iOS CUSTOM PICKER ----------
  if (Platform.OS === 'ios') {
    return (
      <Modal
        animationType="slide"
        transparent
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
          <View style={modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={iosDatePickerContainer}>

                {/* Header */}
                <View style={datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={datePickerButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <Text style={datePickerTitle}>Select Start Date</Text>

                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={[datePickerButtonText, doneButton]}>Done</Text>
                  </TouchableOpacity>
                </View>

                {/* Date Picker */}
                <DateTimePicker
                  value={selectedDate || minimumDate}
                  mode="date"
                  display="spinner"
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  onChange={(event, date) => {
                    if (!date) return;

                    const day = date.getDate();

                    // Restrict SIP: disable 29/30/31
                    if (investmentType === 'SIP' && day > 28) {
                      const nextMonth = new Date(date);
                      nextMonth.setMonth(date.getMonth() + 1);
                      nextMonth.setDate(1);
                      setSelectedDate(nextMonth);
                    } else {
                      setSelectedDate(date);
                    }

                    setErrors(prev => ({ ...prev, date: '' }));
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }

  // ---------- ANDROID DEFAULT PICKER ----------
  return (
    showDatePicker && (
      <DateTimePicker
        value={selectedDate || minimumDate}
        mode="date"
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(event, date) => {
          setShowDatePicker(false);
          if (!date) return;

          const day = date.getDate();

          if (investmentType === 'SIP' && day > 28) {
            const nextMonth = new Date(date);
            nextMonth.setMonth(date.getMonth() + 1);
            nextMonth.setDate(1);
            setSelectedDate(nextMonth);
          } else {
            setSelectedDate(date);
          }

          setErrors(prev => ({ ...prev, date: '' }));
        }}
      />
    )
  );
};

export default StartDatePickerComponent;
