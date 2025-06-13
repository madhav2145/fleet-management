import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList, StyleSheet } from "react-native";
import { ChevronDown, X, Search, Check } from "lucide-react-native";

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
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems =
    searchable && searchQuery
      ? items.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : items;

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
                  <TouchableOpacity onPress={() => setSearchQuery("")}> <X size={16} color="#64748B" /> </TouchableOpacity>
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
                    if (selectedValue === item.value) {
                      onSelect(''); // Clear selection if clicking the same value
                    } else {
                      onSelect(item.value);
                    }
                    setIsOpen(false);
                    setSearchQuery("");
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
  );
};

const styles = StyleSheet.create({
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
});

export default CustomDropdown;
