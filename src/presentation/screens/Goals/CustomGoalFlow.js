import React, { useState } from "react";
import { View } from "react-native";
import GoalInputStep from "./GoalInputStep";     
import SimulationResult from "./SimulationResult";                   
import SummaryReusable from "./SummaryReusable";                    
import LoadingScreen from "./Loader";         
import * as Config from "../../../helpers/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CustomGoalFlow = ({ onGoBack }) => {
  const initialForm = {
    goalType: "CUSTOM",
    amountToday: "",
    years: "",
    inflationRate: "",
    expectedReturn: "",
    lumpsumAvailable: "",
    riskProfile: "",
  };

  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fields = [
    {
      key: "amountToday",
      title: "Custom Goal",
      question: "What is the current cost of your goal?",
      placeholder: "Enter amount (₹)",
      type: "number",
    },
    {
      key: "years",
      title: "Custom Goal",
      question: "How many years until you need this amount?",
      placeholder: "Enter years",
      type: "number",
    },
    {
      key: "inflationRate",
      title: "Custom Goal",
      question: "Expected inflation rate?",
      placeholder: "In percent (%)",
      type: "number",
    },
    {
      key: "expectedReturn",
      title: "Custom Goal",
      question: "Expected annual return on investment?",
      placeholder: "In percent (%)",
      type: "number",
    },
    {
      key: "lumpsumAvailable",
      title: "Custom Goal",
      question: "Any upfront lumpsum available?",
      placeholder: "Enter amount (₹)",
      type: "number",
    },
    {
      key: "riskProfile",
      title: "Custom Goal",
      question: "Choose your risk profile",
      placeholder: "Select risk profile",
      type: "select",
      options: ["LOW", "MODERATE", "HIGH"],
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

      const response = await fetch(`${Config.baseUrl}/api/v1/goals/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const json = await response.json();

      if (response.ok) {
        console.log(json,"custom");
        
        setSimulationResult(json.data);
      } else {
        alert(json.message || "Something went wrong");
      }
    } catch (error) {
      alert("Network Error");
    } finally {
      setLoading(false);
    }
  };


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
        image="https://cdn-icons-png.flaticon.com/512/3208/3208721.png"
        titleField="amountToday"
        subTitle={(f) =>
          `Goal needed in ${f.years} years (adjusted for inflation).`
        }
        config={[
          { key: "amountToday", label: "Amount Today", step: 0 },
          { key: "years", label: "Years to Goal", step: 1 },
          { key: "inflationRate", label: "Inflation Rate (%)", step: 2 },
          { key: "expectedReturn", label: "Expected Return (%)", step: 3 },
          { key: "lumpsumAvailable", label: "Lumpsum Available", step: 4 },
          { key: "riskProfile", label: "Risk Profile", step: 5 },
        ]}
      />
    );
  }

  // ---------- INPUT FORM SCREEN ----------

  return (
    <GoalInputStep
      title={current.title}
      question={current.question}
      placeholder={current.placeholder}
      type={current.type}
      value={form[current.key]}
      options={current.options}
      onChange={(v) => setForm({ ...form, [current.key]: v })}
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

export default CustomGoalFlow;
