import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";

export const colors = [
  "#880606ff",
  "#fc0b0bff",
  "#e76a04ff",
  "#ffe033ff",
  "#1cc232ff",
  "#07501fff",
  "#2bd8f7ff",
  "#1c97e9ff",
  "#0b40b3ff",
  "#4417e4ff",
  "#ff33e4ff",
  "#ff3399ff",
  "#8b33ffff",
  "#361068ff",
  "#000000",
  "#313131ff",
  "#FFFFFF",
];

const SimpleColorPicker = ({
  startingColor,
  onSelectColor,
}: {
  startingColor: string;
  onSelectColor: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(startingColor);

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    if (onSelectColor) {
      onSelectColor(color);
    }
  };

  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={true}
      indicatorStyle="white"
      style={styles.container}
    >
      {colors.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorSquare,
            { backgroundColor: color },
            selectedColor === color && styles.selectedColor,
          ]}
          onPress={() => handleSelectColor(color)}
        >
          {/* {selectedColor === color && <View style={styles.checkmark} />} */}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  colorSquare: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedColor: {
    borderColor: "#fff",
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkmark: {
    width: 20,
    height: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
});

export default SimpleColorPicker;
