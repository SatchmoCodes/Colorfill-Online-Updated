import { User } from "firebase/auth";
import { DocumentReference } from "firebase/firestore";
import React, { RefObject, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { ThemedText } from "../ThemedText";

interface PlayerRefObject {
  name: string;
  uid: string;
}

export const TimerDisplay = ({
  turnDeadline,
  isGameStarted,
  isGameCompleted,
  gameRef,
  ownerRef,
  opponentRef,
  user,
  onEndOfTurn,
  handlePlayerLeave,
}: {
  turnDeadline: number;
  isGameStarted: boolean;
  isGameCompleted: boolean;
  gameRef: DocumentReference;
  ownerRef: RefObject<PlayerRefObject | null>;
  opponentRef: RefObject<PlayerRefObject | null>;
  user: User;
  onEndOfTurn: () => void;
  handlePlayerLeave: (gameRef: DocumentReference, username: string) => void;
}) => {
  const [timeLeft, setTimeLeft] = useState(0);

  const opponent = opponentRef.current;
  const owner = ownerRef.current;

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!turnDeadline || !isGameStarted) return;

    let lastSeconds: number | null = null;
    const interval = setInterval(() => {
      const remaining = turnDeadline - Date.now();
      const roundedSeconds = Math.max(0, Math.floor(remaining / 1000));

      if (roundedSeconds !== lastSeconds) {
        setTimeLeft(roundedSeconds);
        lastSeconds = roundedSeconds;
      }

      if (remaining <= 0 && !isGameCompleted) {
        onEndOfTurn();
      }
      if (remaining <= -15000 && !isGameCompleted && opponent && owner) {
        if (user.displayName === owner.name) {
          handlePlayerLeave(gameRef, opponent.name);
        }
        if (user.displayName === opponent.name) {
          handlePlayerLeave(gameRef, owner.name);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [turnDeadline, isGameStarted, isGameCompleted, onEndOfTurn]);

  useEffect(() => {
    if (timeLeft > 5 || timeLeft <= 0) {
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [timeLeft]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulse }],
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,

        shadowColor: timeLeft <= 5 ? "red" : "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: timeLeft <= 5 ? 0.9 : 0,
        shadowRadius: 10,

        elevation: timeLeft <= 5 ? 8 : 0,
        backgroundColor: "rgba(255,0,0,0.05)",
      }}
    >
      <ThemedText
        style={{
          fontSize: 20,
          color: timeLeft <= 5 ? "red" : "white",
          fontWeight: timeLeft <= 5 ? "bold" : "normal",
        }}
      >
        {timeLeft}
      </ThemedText>
    </Animated.View>
  );
};
