import React, { useState, useEffect } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GoalSelection from "./GoalSelection";
import EducationGoalFlow from "./EducationGoalFlow";
import HomeGoalFlow from "./HomeGoalFlow";
import ChildEducationGoalFlow from "./ChildEducationGoalFlow";
import RetirementGoalFlow from "./RetirementGoalFlow";
import CustomGoalFlow from "./CustomGoalFlow";

const GoalManager = () => {
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    const loadGoal = async () => {
      const saved = await AsyncStorage.getItem("selectedGoal");
      if (saved) setSelectedGoal(saved);
    };
    loadGoal();
  }, []);

  const handleSelectGoal = async (goal) => {
    setSelectedGoal(goal);
    await AsyncStorage.setItem("selectedGoal", goal);
  };

  const resetGoal = async () => {
    await AsyncStorage.removeItem("selectedGoal");
    setSelectedGoal(null);
  };

  switch (selectedGoal) {
    case "Education":
      return <EducationGoalFlow onGoBack={resetGoal} />;

    case "Buy House":
      return <HomeGoalFlow onGoBack={resetGoal} />;

    case "Retirement":
      return <RetirementGoalFlow onGoBack={resetGoal} />;

    case "Child Education":
      return <ChildEducationGoalFlow onGoBack={resetGoal} />;

    case "Custom goal":
      return <CustomGoalFlow onGoBack={resetGoal} />;

    default:
      return <GoalSelection onSelect={handleSelectGoal} />;
  }
};

export default GoalManager;
