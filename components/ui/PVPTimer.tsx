import { User } from "firebase/auth";
import { DocumentReference } from "firebase/firestore";
import React, { RefObject, useEffect, useState } from "react";
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

  return <ThemedText style={{ fontSize: 20 }}>{timeLeft}</ThemedText>;
};
