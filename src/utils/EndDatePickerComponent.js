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

const EndDatePickerComponent = ({
  showEndDatePicker,
  setShowEndDatePicker,
  selectedEndDate,
  setSelectedEndDate,
  selectedStartDate,
  setErrors,
  investmentType,
  styles,
}) => {
  let minimumDate = selectedStartDate ? new Date(selectedStartDate) : new Date();
  let maximumDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  // ---------------- iOS Custom Picker ----------------
  if (Platform.OS === 'ios') {
    return (
      <Modal
        animationType="slide"
        transparent
        visible={showEndDatePicker}
        onRequestClose={() => setShowEndDatePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowEndDatePicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.iosDatePickerContainer}>

                {/* Header */}
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                    <Text style={styles.datePickerButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <Text style={styles.datePickerTitle}>Select End Date</Text>

                  <TouchableOpacity
                    onPress={() => setShowEndDatePicker(false)}
                  >
                    <Text style={[styles.datePickerButtonText, styles.doneButton]}>
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Picker */}
                <DateTimePicker
                  value={selectedEndDate || minimumDate}
                  mode="date"
                  display="spinner"
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  onChange={(event, date) => {
                    if (!date) return;

                    const selectedDay = date.getDate();

                    // Disable 29, 30, 31 for SIP
                    if (investmentType === 'SIP' && selectedDay > 28) {
                      const nextMonth = new Date(date);
                      nextMonth.setMonth(date.getMonth() + 1);
                      nextMonth.setDate(1);
                      setSelectedEndDate(nextMonth);
                    } else {
                      setSelectedEndDate(date);
                    }

                    setErrors(prev => ({ ...prev, endDate: '' }));
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }

  // ---------------- Android Default Picker ----------------
  return (
    showEndDatePicker && (
      <DateTimePicker
        value={selectedEndDate || minimumDate}
        mode="date"
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(event, date) => {
          setShowEndDatePicker(false);
          if (!date) return;

          const selectedDay = date.getDate();

          if (investmentType === 'SIP' && selectedDay > 28) {
            const nextMonth = new Date(date);
            nextMonth.setMonth(date.getMonth() + 1);
            nextMonth.setDate(1);
            setSelectedEndDate(nextMonth);
          } else {
            setSelectedEndDate(date);
          }

          setErrors(prev => ({ ...prev, endDate: '' }));
        }}
      />
    )
  );
};

export default EndDatePickerComponent;
