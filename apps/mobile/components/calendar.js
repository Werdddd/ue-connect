import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../Firebase"; // adjust path if needed

const EventCalendar = () => {
  const [markedDates, setMarkedDates] = useState({});
  const [eventsByDate, setEventsByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "events"));
        const events = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          //console.log(data.date);
          if (data.date) events.push({ id: doc.id, ...data });
        });

        const eventMap = {};
        const marked = {};

        // Parse string like "October 28, 2025"
        const parseDate = (dateStr) => {
          try {
            const months = {
              January: "01",
              February: "02",
              March: "03",
              April: "04",
              May: "05",
              June: "06",
              July: "07",
              August: "08",
              September: "09",
              October: "10",
              November: "11",
              December: "12",
            };
            const [monthName, dayRaw, year] = dateStr.replace(",", "").split(" ");
            const month = months[monthName];
            const day = dayRaw.padStart(2, "0");
            return `${year}-${month}-${day}`;
          } catch {
            return null;
          }
        };

        events.forEach((event) => {
          const dateStr = parseDate(event.date);
          if (!dateStr) return;

          if (!eventMap[dateStr]) eventMap[dateStr] = [];
          eventMap[dateStr].push(event);

          marked[dateStr] = {
            marked: true,
            dotColor: "#007BFF",
          };
        });

        setEventsByDate(eventMap);
        setMarkedDates(marked);
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <View>
      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        theme={{
          selectedDayBackgroundColor: "#007BFF",
          todayTextColor: "#FF6347",
          arrowColor: "#007BFF",
          dotColor: "#007BFF",
          monthTextColor: "#000",
          textMonthFontWeight: "bold",
        }}
      />

      {/* Modal showing events for selected day */}
      <Modal
        visible={!!selectedDate}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Events on {selectedDate}</Text>

            {eventsByDate[selectedDate] ? (
              <FlatList
                data={eventsByDate[selectedDate]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.eventItem}>
                    <Text style={styles.eventName}>
                      {item.organization || "Unnamed Organization"}
                    </Text>
                    <Text>{item.description || "No description"}</Text>
                    <Text style={styles.eventDetails}>
                      📍 {item.location || "Unknown"} | 👥{" "}
                      {item.participants || 0} participants
                    </Text>
                  </View>
                )}
              />
            ) : (
              <Text>No events found</Text>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedDate(null)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EventCalendar;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    maxHeight: "70%",
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
  eventItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  eventName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  eventDetails: {
    color: "#666",
  },
  closeButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
