import React, { Dispatch, SetStateAction } from "react";
import { StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

interface Options {
  label: string;
  value: string;
}

interface ThemedDropDownProps<T extends string> {
  options: Options[];
  // value now accepts the generic type T (e.g., PVPBoardSize)
  value: T;
  // onSetValue now expects the full React state dispatcher type
  onSetValue: Dispatch<SetStateAction<T>>;
  placeholder: string; // Placeholder text for when no item is selected
}

export default function ThemedDropDown<T extends string>({
  options,
  value,
  onSetValue,
  placeholder,
}: ThemedDropDownProps<T>) {
  return (
    <View style={{ minWidth: 200 }}>
      <Dropdown
        data={options}
        labelField="label"
        valueField="value"
        style={styles.dropdown}
        placeholder={placeholder}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        value={value}
        onChange={(item) => onSetValue(item.value)}
        containerStyle={styles.dropdownContainerStyle}
        itemContainerStyle={styles.dropdownItemContainerStyle}
        itemTextStyle={styles.dropdownItemTextStyle}
        activeColor="#333333"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    width: 200,
    backgroundColor: "#222222",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 45,
    borderWidth: 1,
    borderColor: "#555555",
  },
  placeholderStyle: {
    color: "#BBBBBB",
    fontSize: 16,
  },
  selectedTextStyle: {
    color: "white",
    fontSize: 16,
  },
  dropdownContainerStyle: {
    backgroundColor: "#222222",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555555",
    overflow: "hidden",
  },
  dropdownItemContainerStyle: {
    backgroundColor: "#222222",
    padding: 0,
    margin: 0,
  },
  dropdownItemTextStyle: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    color: "white",
  },
});
