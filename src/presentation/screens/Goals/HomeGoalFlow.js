import React, { useState } from "react";
import { View } from "react-native";
import GoalInputStep from "./GoalInputStep";     
import SimulationResult from "./SimulationResult";                   
import SummaryReusable from "./SummaryReusable";                    
import LoadingScreen from "./Loader";         
import * as Config from "../../../helpers/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeGoalFlow = ({ onGoBack }) => {
  const initialForm = {
    goalType: "HOME",
    homeCostToday: "",
    yearsToBuy: "",
    willTakeLoan: "",
    downpaymentPercent: "",
    lumpsumAvailable: "",
    inflationRate: "",
    expectedReturn: "",
    riskProfile: "",
  };

  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fields = [
    { key: "homeCostToday", title: "Home Goal", question: "What is the home cost today?", placeholder: "Enter amount (₹)", type: "number" },
    { key: "yearsToBuy", title: "Home Goal", question: "In how many years do you want to buy the home?", placeholder: "Years", type: "number" },
    { key: "willTakeLoan", title: "Home Goal", question: "Will you take a home loan?", placeholder: "Select option", type: "select", options: ["Yes", "No"] },
    { key: "downpaymentPercent", title: "Home Goal", question: "Downpayment percent?", placeholder: "Enter percentage", type: "number" },
    { key: "lumpsumAvailable", title: "Home Goal", question: "Any lumpsum available?", placeholder: "Enter amount (₹)", type: "number" },
    { key: "inflationRate", title: "Home Goal", question: "Expected inflation?", placeholder: "In percent (%)", type: "number" },
    { key: "expectedReturn", title: "Home Goal", question: "Expected return?", placeholder: "In percent (%)", type: "number" },
    { key: "riskProfile", title: "Home Goal", question: "Choose risk profile", placeholder: "Select profile", type: "select", options: ["Moderate", "Conservative", "Aggressive"] },
  ];

  const current = fields[step];

  const handleNext = () => {
    if (step < fields.length - 1) setStep(step + 1);
    else setShowSummary(true);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const body = {
        ...form,
        willTakeLoan: form.willTakeLoan === "Yes",
      };

      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${Config.getBaseUrl()}/api/v1/goals/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (res.ok) setSimulationResult(json.data);
      else alert(json.message);
    } catch {
      alert("Network Error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (simulationResult) return <SimulationResult data={simulationResult} />;

  if (showSummary)
    return (
      <SummaryReusable
        form={form}
        onEdit={(s) => {
          setStep(s);
          setShowSummary(false);
        }}
        onConfirm={handleConfirm}
        image="https://cdn-icons-png.flaticon.com/512/619/619153.png"
        titleField="homeCostToday"
        subTitle={(f) => `For a ${f.yearsToBuy}-year home purchase plan.`}
        config={[
          { key: "homeCostToday", label: "Home Cost Today", step: 0 },
          { key: "yearsToBuy", label: "Years to Buy", step: 1 },
          { key: "willTakeLoan", label: "Will Take Loan", step: 2 },
          { key: "downpaymentPercent", label: "Downpayment %", step: 3 },
          { key: "lumpsumAvailable", label: "Lumpsum Available", step: 4 },
          { key: "inflationRate", label: "Inflation Rate (%)", step: 5 },
          { key: "expectedReturn", label: "Expected Return (%)", step: 6 },
          { key: "riskProfile", label: "Risk Profile", step: 7 },
        ]}
      />
    );

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

export default HomeGoalFlow;
