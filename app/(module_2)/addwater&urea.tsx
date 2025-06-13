"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Pressable,
  Modal,
  FlatList,
} from "react-native"
import { useRouter } from "expo-router"
import { collection, getDocs, doc, setDoc, updateDoc, getDoc } from "firebase/firestore"
import { auth, firestore } from "../../firebaseConfig"
import { ArrowLeft, Droplet, Package, Calendar, PlusCircle, TrendingDown, Truck, ChevronDown, X, Search, Check } from "lucide-react-native"
import DateTimePicker from "@react-native-community/datetimepicker"

const CustomDropdown = ({
  items,
  selectedValue,
  onSelect,
  placeholder,
  searchable = false,
  disabled = false,
}: {
  items: { label: string; value: string }[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  placeholder: string;
  searchable?: boolean;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredItems =
    searchable && searchQuery
      ? items.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : items

  return (
    <View style={{ marginBottom: 12 }}>
      <TouchableOpacity
        style={[styles.dropdownButton, disabled && styles.dropdownButtonDisabled]}
        onPress={() => !disabled && setIsOpen(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[styles.dropdownButtonText, !selectedValue && styles.dropdownPlaceholder]}>
          {selectedValue ? items.find((item) => item.value === selectedValue)?.label : placeholder}
        </Text>
        <ChevronDown size={18} color="#64748B" />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent={true} animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={styles.searchContainer}>
                <Search size={16} color="#64748B" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <X size={16} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.value}
              style={styles.dropdownList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSelect(item.value)
                    setIsOpen(false)
                    setSearchQuery("")
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item.label}</Text>
                  {selectedValue === item.value && <Check size={16} color="#1E3A8A" />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>No items found</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const AddWaterUrea: React.FC = () => {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<string[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [vehicleItems, setVehicleItems] = useState<{ label: string; value: string }[]>([]) // Dropdown items
  const [vehicleData, setVehicleData] = useState<{ [key: string]: any }>({})
  const [selectedPackets, setSelectedPackets] = useState<string>("0")
  const [selectedOption, setSelectedOption] = useState<"water" | "urea">("water") // Default to 'water'
  const [totalWaterReceived, setTotalWaterReceived] = useState<string>("0") // Separate state for water
  const [totalUreaReceived, setTotalUreaReceived] = useState<string>("0") // Separate state for urea
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]) // Default to today's date
  const [showDatePicker, setShowDatePicker] = useState(false) // State to show/hide date picker
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [existingData, setExistingData] = useState<{ [key: string]: any }>({})
  const [userRole, setUserRole] = useState<"user" | "admin">("user") // Default role is 'user'

  const formatDate = (date: string) => {
    const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
    return new Date(date).toLocaleDateString("en-US", options)
  }

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoading(true)
        const querySnapshot = await getDocs(collection(firestore, "waterandurea"))
        const vehicleList = querySnapshot.docs.map((doc) => doc.id).filter((id) => id !== "totalReceived") // Exclude "totalReceived"

        setVehicles(vehicleList)
        setVehicleItems(vehicleList.map((vehicle) => ({ label: vehicle, value: vehicle }))) // Map vehicles to dropdown items
      } catch (error) {
        console.error("Error fetching vehicles:", error)
        Alert.alert("Error", "Failed to fetch vehicles. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const docRef = doc(firestore, "waterandurea", "totalReceived")
        const docSnapshot = await getDoc(docRef)

        if (docSnapshot.exists()) {
          setExistingData(docSnapshot.data())
        } else {
          setExistingData({})
        }
      } catch (error) {
        console.error("Error fetching existing data:", error)
        Alert.alert("Error", "Failed to fetch existing data. Please try again.")
      }
    }

    fetchExistingData()
  }, [selectedDate])

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = auth.currentUser
        if (user) {
          const userDoc = await getDoc(doc(firestore, "users", user.uid))
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role) // Set the user's role (e.g., 'user' or 'admin')
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error)
      }
    }

    fetchUserRole()
  }, [])

  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!selectedVehicle) return

      try {
        const vehicleDocRef = doc(firestore, "waterandurea", selectedVehicle)
        const vehicleDocSnapshot = await getDoc(vehicleDocRef)

        if (vehicleDocSnapshot.exists()) {
          setVehicleData(vehicleDocSnapshot.data())
        } else {
          setVehicleData({})
        }
      } catch (error) {
        console.error("Error fetching vehicle data:", error)
        Alert.alert("Error", "Failed to fetch vehicle data. Please try again.")
      }
    }

    fetchVehicleData()
  }, [selectedVehicle, selectedDate])

  const calculateAndUpdateTotals = async () => {
    try {
      const docRef = doc(firestore, "waterandurea", "totalReceived")
      const docSnapshot = await getDoc(docRef)

      if (docSnapshot.exists()) {
        const data = docSnapshot.data()

        const totalWater = Object.values(data)
          .filter((entry: any) => entry?.water !== undefined)
          .reduce((sum, entry: any) => sum + entry.water, 0)

        const totalUrea = Object.values(data)
          .filter((entry: any) => entry?.urea !== undefined)
          .reduce((sum, entry: any) => sum + entry.urea, 0)

        await updateDoc(docRef, {
          totalWater,
          totalUrea,
        })

        console.log("Totals updated:", { totalWater, totalUrea })
      }
    } catch (error) {
      console.error("Error calculating and updating totals:", error)
    }
  }

  const calculateAndUpdateTotalDistributed = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "waterandurea"))

      let totalDistributedWater = 0
      let totalDistributedUrea = 0

      querySnapshot.forEach((doc) => {
        if (doc.id !== "totalReceived") {
          const data = doc.data()
          Object.values(data).forEach((entry: any) => {
            if (entry?.water !== undefined) {
              totalDistributedWater += entry.water
            }
            if (entry?.urea !== undefined) {
              totalDistributedUrea += entry.urea
            }
          })
        }
      })

      const totalReceivedRef = doc(firestore, "waterandurea", "totalReceived")
      await updateDoc(totalReceivedRef, {
        totalDistributedWater,
        totalDistributedUrea,
      })

      console.log("Total distributed updated:", { totalDistributedWater, totalDistributedUrea })
    } catch (error) {
      console.error("Error calculating and updating total distributed:", error)
    }
  }

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false) // Close the date picker
    if (date) {
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)

      // Restrict date selection for 'user' role
      if (userRole === "user") {
        if (date.toDateString() === today.toDateString() || date.toDateString() === yesterday.toDateString()) {
          setSelectedDate(date.toISOString().split("T")[0]) // Update the selected date
        } else {
          Alert.alert("Error", "You can only select Today or Yesterday dates.")
        }
      } else {
        // Allow all dates for 'admin' role
        setSelectedDate(date.toISOString().split("T")[0])
      }
    }
  }

  const handleSubmit = async () => {
    if (!selectedVehicle || !selectedOption) {
      Alert.alert("Error", "Please select a vehicle and an option (Water/Urea).")
      return
    }

    try {
      setIsLoading(true)
      const totalDistributedRef = doc(firestore, "waterandurea", selectedVehicle)
      const totalReceivedRef = doc(firestore, "waterandurea", "totalReceived")

      const totalDistributedSnapshot = await getDoc(totalDistributedRef)
      const totalReceivedSnapshot = await getDoc(totalReceivedRef)

      const requestedAmount = Number.parseInt(selectedPackets)
      let updatedVehicleData = {}
      let previousValue = 0

      if (totalDistributedSnapshot.exists()) {
        const existingData = totalDistributedSnapshot.data()
        previousValue = existingData[selectedDate]?.[selectedOption] || 0

        updatedVehicleData = {
          ...existingData,
          [selectedDate]: {
            ...existingData[selectedDate],
            [selectedOption]: requestedAmount,
          },
        }
      } else {
        updatedVehicleData = {
          [selectedDate]: {
            water: selectedOption === "water" ? requestedAmount : 0,
            urea: selectedOption === "urea" ? requestedAmount : 0,
          },
        }
      }

      await setDoc(totalDistributedRef, updatedVehicleData)

      const totalWaterForVehicle = Object.values(updatedVehicleData)
        .filter((entry: any) => entry?.water !== undefined)
        .reduce((sum, entry: any) => sum + entry.water, 0)

      const totalUreaForVehicle = Object.values(updatedVehicleData)
        .filter((entry: any) => entry?.urea !== undefined)
        .reduce((sum, entry: any) => sum + entry.urea, 0)

      await updateDoc(totalDistributedRef, {
        totalWater: totalWaterForVehicle,
        totalUrea: totalUreaForVehicle,
      })

      if (totalReceivedSnapshot.exists()) {
        const totalReceivedData = totalReceivedSnapshot.data()
        const totalKey = selectedOption === "water" ? "totalDistributedWater" : "totalDistributedUrea"

        const updatedTotal = (totalReceivedData[totalKey] || 0) + (requestedAmount - previousValue)

        await updateDoc(totalReceivedRef, {
          [totalKey]: updatedTotal,
        })
      } else {
        await setDoc(totalReceivedRef, {
          totalDistributedWater: selectedOption === "water" ? requestedAmount : 0,
          totalDistributedUrea: selectedOption === "urea" ? requestedAmount : 0,
        })
      }

      Alert.alert(
        "Success",
        `You have distributed ${requestedAmount} ${
          selectedOption === "water" ? "water packets" : "urea buckets"
        } to vehicle ${selectedVehicle} for ${selectedDate}.`,
      )

      setSelectedVehicle(null)
      setSelectedPackets("0")
      setSelectedOption("water")
    } catch (error) {
      console.error("Error saving data:", error)
      Alert.alert("Error", "Failed to save data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTotalReceived = async (type: "water" | "urea") => {
    const totalReceived = type === "water" ? totalWaterReceived : totalUreaReceived

    if (!totalReceived || !selectedDate) {
      Alert.alert("Error", "Please enter the total received quantity and select a date.")
      return
    }

    try {
      setIsLoading(true)
      const docRef = doc(firestore, "waterandurea", "totalReceived")
      const docSnapshot = await getDoc(docRef)

      let updatedData: {
        [key: string]: any
        totalWater?: number
        totalUrea?: number
      } = {}
      let previousValue = 0

      if (docSnapshot.exists()) {
        const existingData = docSnapshot.data() as {
          [key: string]: any
          totalWater?: number
          totalUrea?: number
          totalDistributedWater?: number
          totalDistributedUrea?: number
        }

        previousValue = existingData[selectedDate]?.[type] || 0

        const totalKey = type === "water" ? "totalWater" : "totalUrea"
        const distributedKey = type === "water" ? "totalDistributedWater" : "totalDistributedUrea"
        const newTotal = (existingData[totalKey] || 0) + (Number.parseInt(totalReceived) - previousValue)

        const totalDistributed = existingData[distributedKey] || 0
        const remaining = newTotal - totalDistributed

        if (remaining < 0) {
          Alert.alert(
            "Error",
            `Cannot update the ${type === "water" ? "water packets" : "urea buckets"} received. The value is less than the distributed count.`,
          )
          return
        }

        updatedData = {
          ...existingData,
          [selectedDate]: {
            ...existingData[selectedDate],
            [type]: Number.parseInt(totalReceived),
          },
          [totalKey]: newTotal,
        }

        await setDoc(docRef, updatedData)

        const remainingWater = (updatedData.totalWater || 0) - (updatedData.totalDistributedWater || 0)
        const remainingUrea = (updatedData.totalUrea || 0) - (updatedData.totalDistributedUrea || 0)

        if (type === "water" && remainingWater < 100) {
          Alert.alert("Low Resources", "Remaining water is less than 100. Please order more.")
        } else if (type === "urea" && remainingUrea < 10) {
          Alert.alert("Low Resources", "Remaining urea is less than 10. Please order more.")
        }
      } else {
        updatedData = {
          [selectedDate]: {
            water: type === "water" ? Number.parseInt(totalReceived) : 0,
            urea: type === "urea" ? Number.parseInt(totalReceived) : 0,
          },
          totalWater: type === "water" ? Number.parseInt(totalReceived) : 0,
          totalUrea: type === "urea" ? Number.parseInt(totalReceived) : 0,
          totalDistributedWater: 0,
          totalDistributedUrea: 0,
        }

        await setDoc(docRef, updatedData)

        if (type === "water" && (updatedData.totalWater ?? 0) < 100) {
          Alert.alert("Low Resources", "Remaining water is less than 100. Please order more.")
        } else if (type === "urea" && (updatedData.totalUrea ?? 0) < 10) {
          Alert.alert("Low Resources", "Remaining urea is less than 10. Please order more.")
        }
      }

      const updatedDocSnapshot = await getDoc(docRef)
      if (updatedDocSnapshot.exists()) {
        setExistingData(updatedDocSnapshot.data())
      }

      Alert.alert(
        "Success",
        `You have updated ${totalReceived} ${type === "water" ? "water packets" : "urea buckets"} received for ${selectedDate}.`,
      )

      if (type === "water") {
        setTotalWaterReceived("0")
      } else {
        setTotalUreaReceived("0")
      }
      setSelectedDate(new Date().toISOString().split("T")[0])
    } catch (error) {
      console.error("Error saving total received data:", error)
      Alert.alert("Error", "Failed to save total received data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Generate dropdown items for numbers ranging from 0 to 100
  const packetOptions = Array.from({ length: 101 }, (_, i) => ({ label: i.toString(), value: i.toString() }))

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled={true} // Allow nested scrolling
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Resource Status</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.dateSelectorContainer}>
          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <View style={styles.dateButtonContent}>
              <Calendar size={16} color="#1E3A8A" style={styles.dateIcon} />
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateLabel}>Select Date</Text>
                <Text style={styles.dateValue}>{formatDate(selectedDate)}</Text>
              </View>
            </View>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(selectedDate)}
              mode="date"
              display="default"
              onChange={(event, date) => handleDateChange(event, date)}
            />
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <PlusCircle size={20} color="#1E3A8A" />
            <Text style={styles.cardTitle}>Add New Resources</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Droplet size={18} color="#0EA5E9" style={styles.inputIcon} />
              <Text style={styles.label}>Water Packets Received</Text>
            </View>
            <Text style={styles.currentValue}>
              <Text style={styles.currentValueLabel}>Current: </Text>
              <Text style={styles.currentValueNumber}>{existingData[selectedDate]?.water || 0}</Text> packets
            </Text>
            <TextInput
              value={totalWaterReceived}
              onChangeText={(text) => setTotalWaterReceived(text)}
              keyboardType="numeric"
              placeholder="Enter number of water packets to update"
              style={styles.textInput}
            />
            <TouchableOpacity
              style={[styles.submitButton, styles.waterButton]}
              onPress={() => handleTotalReceived("water")}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <PlusCircle size={18} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.submitButtonText}>Update Water Packets</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Package size={18} color="#8B5CF6" style={styles.inputIcon} />
              <Text style={styles.label}>Urea Buckets Received</Text>
            </View>
            <Text style={styles.currentValue}>
              <Text style={styles.currentValueLabel}>Current: </Text>
              <Text style={styles.currentValueNumber}>{existingData[selectedDate]?.urea || 0}</Text> buckets
            </Text>
            <TextInput
              value={totalUreaReceived}
              onChangeText={(text) => setTotalUreaReceived(text)}
              keyboardType="numeric"
              placeholder="Enter number of urea buckets to update"
              style={styles.textInput}
            />
            <TouchableOpacity
              style={[styles.submitButton, styles.ureaButton]}
              onPress={() => handleTotalReceived("urea")}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <PlusCircle size={18} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.submitButtonText}>Update Urea Buckets</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TrendingDown size={20} color="#1E3A8A" />
            <Text style={styles.cardTitle}>Distribute to Vehicles</Text>
          </View>

          <Text style={styles.sectionLabel}>Select Resource Type</Text>
          <View style={styles.optionContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === "water" ? styles.waterOptionSelected : styles.optionUnselected,
              ]}
              onPress={() => setSelectedOption("water")}
            >
              <Droplet size={20} color={selectedOption === "water" ? "#FFFFFF" : "#0EA5E9"} style={styles.optionIcon} />
              <Text
                style={[
                  styles.optionText,
                  selectedOption === "water" ? styles.selectedOptionText : styles.unselectedOptionText,
                ]}
              >
                Water
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === "urea" ? styles.ureaOptionSelected : styles.optionUnselected,
              ]}
              onPress={() => setSelectedOption("urea")}
            >
              <Package size={20} color={selectedOption === "urea" ? "#FFFFFF" : "#8B5CF6"} style={styles.optionIcon} />
              <Text
                style={[
                  styles.optionText,
                  selectedOption === "urea" ? styles.selectedOptionText : styles.unselectedOptionText,
                ]}
              >
                Urea
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Truck size={18} color="#1E3A8A" style={styles.inputIcon} />
              <Text style={styles.label}>Select Vehicle</Text>
            </View>
            <CustomDropdown
              items={vehicleItems}
              selectedValue={selectedVehicle}
              onSelect={setSelectedVehicle}
              placeholder="Select a vehicle"
              searchable={true}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              {selectedOption === "water" ? (
                <Droplet size={18} color="#0EA5E9" style={styles.inputIcon} />
              ) : (
                <Package size={18} color="#8B5CF6" style={styles.inputIcon} />
              )}
              <Text style={styles.label}>
                Number of {selectedOption === "water" ? "Water Packets" : "Urea Buckets"}
              </Text>
            </View>
            <CustomDropdown
              items={packetOptions}
              selectedValue={selectedPackets}
              onSelect={setSelectedPackets}
              placeholder={`Select number of ${selectedOption === "water" ? "water packets" : "urea buckets"}`}
            />
          </View>

          {selectedVehicle && (
            <>
              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Droplet size={18} color="#0EA5E9" style={styles.inputIcon} />
                  <Text style={styles.label}>Current Water Packets</Text>
                </View>
                <Text style={styles.currentValue}>
                  <Text style={styles.currentValueLabel}>Current: </Text>
                  <Text style={styles.currentValueNumber}>
                    {vehicleData[selectedDate]?.water || 0}
                  </Text>{" "}
                  packets
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Package size={18} color="#8B5CF6" style={styles.inputIcon} />
                  <Text style={styles.label}>Current Urea Buckets</Text>
                </View>
                <Text style={styles.currentValue}>
                  <Text style={styles.currentValueLabel}>Current: </Text>
                  <Text style={styles.currentValueNumber}>
                    {vehicleData[selectedDate]?.urea || 0}
                  </Text>{" "}
                  buckets
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              selectedOption === "water" ? styles.waterButton : styles.ureaButton,
              styles.distributeButton,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <TrendingDown size={18} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.submitButtonText}>Distribute {selectedOption === "water" ? "Water" : "Urea"}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginLeft: 10,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  dropdown: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  optionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    width: "48%",
  },
  optionIcon: {
    marginRight: 8,
  },
  waterOptionSelected: {
    backgroundColor: "#0EA5E9",
  },
  ureaOptionSelected: {
    backgroundColor: "#8B5CF6",
  },
  optionUnselected: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectedOptionText: {
    color: "#FFFFFF",
  },
  unselectedOptionText: {
    color: "#64748B",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  waterButton: {
    backgroundColor: "#0EA5E9",
  },
  ureaButton: {
    backgroundColor: "#8B5CF6",
  },
  distributeButton: {
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 12,
    marginTop: -8,
  },
  currentValue: {
    fontSize: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  currentValueLabel: {
    color: "#64748B",
    fontWeight: "500",
  },
  currentValueNumber: {
    color: "#1E3A8A",
    fontWeight: "700",
  },
  dateSelectorContainer: {
    marginBottom: 16,
  },
  dateButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 8,
  },
  dateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  dateIcon: {
    marginRight: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  dropdownButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    height: 46,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownButtonDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#334155",
  },
  dropdownPlaceholder: {
    color: "#64748B",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "80%",
    maxHeight: "70%",
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
  },
  dropdownList: {
    flexGrow: 0,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#334155",
  },
  emptyList: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyListText: {
    fontSize: 14,
    color: "#64748B",
  },
  dateTextContainer: {
    flex: 1,
  },
})

export default AddWaterUrea
