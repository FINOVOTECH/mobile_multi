import React, { useState } from "react";
import { View } from "react-native";
import GoalInputStep from "./GoalInputStep";     
import SimulationResult from "./SimulationResult";                   
import SummaryReusable from "./SummaryReusable";                    
import LoadingScreen from "./Loader";         
import * as Config from "../../../helpers/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChildEducationGoalFlow = ({ onGoBack }) => {
  const initialForm = {
    goalName: "Child Education Goal",
    goalType: "EDUCATION",
    educationCostToday: "",
    childCurrentAge: "",
    targetEducationAge: "",
    inflationRate: "",
    expectedReturn: "",
    lumpsumAvailable: "",
    riskProfile: "",
    selectedSchemes: [],
  };

  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fields = [
    {
      key: "educationCostToday",
      title: "Child Education Goal",
      question: "What is the estimated education cost today?",
      placeholder: "Enter amount (₹)",
      type: "number",
    },
    {
      key: "childCurrentAge",
      title: "Child Education Goal",
      question: "How old is your child currently?",
      placeholder: "Age in years",
      type: "number",
    },
    {
      key: "targetEducationAge",
      title: "Child Education Goal",
      question: "At what age will the child pursue higher education?",
      placeholder: "Age (e.g. 18)",
      type: "number",
    },
    {
      key: "inflationRate",
      title: "Child Education Goal",
      question: "Expected inflation rate for education?",
      placeholder: "In percent (%)",
      type: "number",
    },
    {
      key: "expectedReturn",
      title: "Expected Return",
      question: "Expected annual return on your investment?",
      placeholder: "In percent (%)",
      type: "number",
    },
    {
      key: "lumpsumAvailable",
      title: "Lumpsum Available",
      question: "Any initial lumpsum amount available?",
      placeholder: "Enter amount (₹)",
      type: "number",
    },
    {
      key: "riskProfile",
      title: "Risk Profile",
      question: "Choose your preferred risk profile",
      placeholder: "Select risk profile",
      type: "select",
      options: ["MODERATE", "CONSERVATIVE", "AGGRESSIVE"],
    },
  ];

  const current = fields[step];

  const handleNext = () => {
    if (step < fields.length - 1) {
      setStep(step + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${Config.baseUrl}/api/v1/goals/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSimulationResult(data.data);
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (e) {
      alert("Network Error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI STATES ----------

  if (loading) return <LoadingScreen />;

  if (simulationResult) {
    return <SimulationResult data={simulationResult} />;
  }

  if (showSummary) {
    return (
      <SummaryReusable
        form={form}
        onEdit={(gotoStep) => {
          setStep(gotoStep);
          setShowSummary(false);
        }}
        onConfirm={handleConfirm}
        image="https://cdn-icons-png.flaticon.com/512/327/327799.png"
        titleField="educationCostToday"
        subTitle={(f) =>
          `Total cost today for a ${
            f.targetEducationAge - f.childCurrentAge
          }-year goal.`
        }
        config={[
          { key: "educationCostToday", label: "Education Cost Today", step: 0 },
          { key: "childCurrentAge", label: "Child Current Age", step: 1 },
          { key: "targetEducationAge", label: "Target Education Age", step: 2 },
          { key: "inflationRate", label: "Inflation Rate (%)", step: 3 },
          { key: "expectedReturn", label: "Expected Return (%)", step: 4 },
          { key: "lumpsumAvailable", label: "Lumpsum Available", step: 5 },
          { key: "riskProfile", label: "Risk Profile", step: 6 },
        ]}
      />
    );
  }

  // ---------- Step Input Screen ----------

  return (
    <GoalInputStep
      title={current.title}
      question={current.question}
      placeholder={current.placeholder}
      type={current.type}
      value={form[current.key]}
      options={current.options}
      onChange={(value) => setForm({ ...form, [current.key]: value })}
      onNext={handleNext}
      onBack={() => setStep(step - 1)}
      onStartOver={() => {
        setForm(initialForm);
        setStep(0);
        onGoBack();
      }}
      isFirstStep={step === 0}
    />
  );
};

export default ChildEducationGoalFlow;
