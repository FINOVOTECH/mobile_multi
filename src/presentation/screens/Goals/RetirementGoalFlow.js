import React, { useState } from "react";
import { View } from "react-native";
import GoalInputStep from "./GoalInputStep";     
import SimulationResult from "./SimulationResult";                   
import SummaryReusable from "./SummaryReusable";                    
import LoadingScreen from "./Loader";         
import * as Config from "../../../helpers/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RetirementGoalFlow = ({ onGoBack }) => {
  const initialForm = {
    goalType: "RETIREMENT",
    age: "",
    retirementAge: "",
    lifeExpectancy: "",
    monthlyExpenseToday: "",
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
    { key: "age", title: "Retirement Planning", question: "Your current age?", placeholder: "Enter age", type: "number" },
    { key: "retirementAge", title: "Retirement Planning", question: "Age at which you want to retire?", placeholder: "Enter age", type: "number" },
    { key: "lifeExpectancy", title: "Retirement Planning", question: "Till what age should we plan?", placeholder: "Enter life expectancy", type: "number" },
    { key: "monthlyExpenseToday", title: "Retirement Planning", question: "Current monthly expense?", placeholder: "Enter amount (₹)", type: "number" },
    { key: "inflationRate", title: "Retirement Planning", question: "Expected inflation?", placeholder: "In percent (%)", type: "number" },
    { key: "expectedReturn", title: "Retirement Planning", question: "Expected annual return?", placeholder: "In percent (%)", type: "number" },
    { key: "lumpsumAvailable", title: "Retirement Planning", question: "Any lumpsum available?", placeholder: "Enter amount (₹)", type: "number" },
    { key: "riskProfile", title: "Retirement Planning", question: "Choose risk profile", placeholder: "Select", type: "select", options: ["Moderate", "Conservative", "Aggressive"] },
  ];

  const current = fields[step];

  const handleNext = () => {
    if (step < fields.length - 1) setStep(step + 1);
    else setShowSummary(true);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      // console.log(token,"tokennnnnnnnnnnnnnnn");
      

      const res = await fetch(`${Config.baseUrl}/api/v1/goals/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
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
        onEdit={(gotoStep) => {
          setStep(gotoStep);
          setShowSummary(false);
        }}
        onConfirm={handleConfirm}
        image="https://cdn-icons-png.flaticon.com/512/1997/1997014.png"
        titleField="monthlyExpenseToday"
        subTitle={(f) => `Planning from age ${f.age} until ${f.lifeExpectancy}, retiring at ${f.retirementAge}.`}
        config={[
          { key: "age", label: "Current Age", step: 0 },
          { key: "retirementAge", label: "Retirement Age", step: 1 },
          { key: "lifeExpectancy", label: "Life Expectancy", step: 2 },
          { key: "monthlyExpenseToday", label: "Monthly Expense Today", step: 3 },
          { key: "inflationRate", label: "Inflation Rate (%)", step: 4 },
          { key: "expectedReturn", label: "Expected Return (%)", step: 5 },
          { key: "lumpsumAvailable", label: "Lumpsum Available", step: 6 },
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

export default RetirementGoalFlow;
