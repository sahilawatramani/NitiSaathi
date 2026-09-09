import React, { useState } from 'react';
import { View, Text, Image, SafeAreaView, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StepIndicator } from '../../components/onboarding/StepIndicator';
import { OnboardingOptionCard } from '../../components/onboarding/OnboardingOptionCard';
import { ToggleRow } from '../../components/shared/ToggleRow';
import { createSession } from '../../api/auth';
import { createUserProfile, setConsent } from '../../api/user';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const PlatformChip = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    className={`px-4 py-2 rounded-full border transition-colors ${
      selected
        ? 'bg-primary-container border-primary-container'
        : 'bg-transparent border-outline-variant hover:bg-caution-tint hover:border-primary-container'
    }`}
  >
    <Text className={`font-label-lg text-label-lg ${
      selected ? 'text-on-primary' : 'text-on-surface'
    }`}>
      {label}
    </Text>
  </Pressable>
);

const SegmentedControl = ({ options, selected, onSelect }: { options: string[], selected: string, onSelect: (v: string) => void }) => (
  <View className="flex-row p-1 bg-background-off-white rounded-lg border border-surface-container-high self-start">
    {options.map(opt => {
      const isSelected = selected === opt;
      return (
        <Pressable
          key={opt}
          onPress={() => onSelect(opt)}
          className={`px-4 py-2 rounded-md transition-colors ${
            isSelected ? 'bg-caution-tint' : 'bg-transparent hover:bg-surface-variant'
          }`}
        >
          <Text className={`font-label-lg text-label-lg ${
            isSelected ? 'text-primary font-semibold' : 'text-on-surface-variant'
          }`}>
            {opt}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Step 1
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // Step 2
  const [comfortLevel, setComfortLevel] = useState<string>('intermediate');
  
  // Step 3
  const [age, setAge] = useState<string>('');
  const [income, setIncome] = useState<string>('');
  const [platforms, setPlatforms] = useState<string[]>(['Swiggy', 'Rapido']);
  const [emi, setEmi] = useState<string>('Yes');
  const [eShram, setEShram] = useState<string>('Not sure');
  const [epfoEsic, setEpfoEsic] = useState<string>('No');
  const [stateName, setStateName] = useState<string>('');
  const [savingsBankAccount, setSavingsBankAccount] = useState<string>('Yes');
  const [aadhaarLinked, setAadhaarLinked] = useState<string>('Yes');
  const [daysActive, setDaysActive] = useState<string>('');

  // Step 4
  const [consentTransaction, setConsentTransaction] = useState<boolean>(false);
  const [consentEligibility, setConsentEligibility] = useState<boolean>(false);
  const [consentFraud, setConsentFraud] = useState<boolean>(false);
  const [consentNotifications, setConsentNotifications] = useState<boolean>(false);
  const [consentReports, setConsentReports] = useState<boolean>(false);

  const router = useRouter();
  const { setLanguage } = useLanguage();
  const { register, login } = useAuth();

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setLanguage(lang as 'hi' | 'en' | 'mr');
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4) {
      try {
        await register(email, password);
        const userData = {
          language: selectedLanguage,
          comfortLevel,
          age,
          income,
          platforms,
          emi,
          eShram,
          epfoEsic,
          state: stateName || 'Maharashtra',
          savings_bank_account: savingsBankAccount === 'Yes',
          aadhaar_linked: aadhaarLinked === 'Yes',
          days_active_with_aggregator: daysActive,
        };
        await createUserProfile(userData);

        // Purpose names match ALLOWED_PURPOSES in backend privacy.py
        const consents = [
          { purpose: 'transactions', granted: consentTransaction },
          { purpose: 'scheme_eligibility', granted: consentEligibility },
          { purpose: 'fraud_detection', granted: consentFraud },
          { purpose: 'nudges', granted: consentNotifications },
          { purpose: 'reports', granted: consentReports }
        ];
        for (const c of consents) {
          try {
            await setConsent(c.purpose, c.granted, selectedLanguage);
          } catch (err) {
            console.warn(`Failed to set consent for ${c.purpose}:`, err);
          }
        }

        router.replace('/');
      } catch (e) {
        console.error('Failed to submit onboarding data:', e);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      }
    }
  };

  const renderStep1 = () => (
    <>
      <View className="mb-stack-md w-48 h-48 items-center justify-center self-center">
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida/AP1WRLs3B7w5JR1nWR_dYHyQ_22jPqhWw1-00FpuyFKVQRPoeO39a_b4oxtjB_qgDShEqMS0mVYqqqHF7O7bKcMNHoe_ACkiQOV1eCusE61so_09FX5BnwKu3_QyA1EsUr5iBbFnmiTGVSvwG1xMbQCGvtu37mjX5067vZNmu8NGddJ85dsStP6C2K37jmLRUZKTI15kneskloJLs0I9tF8myAltsGCAxd9iydjLGWYxcy1opWUwLDii-hopjoex' }}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>

      <View className="items-center mb-stack-lg">
        <Text className="font-display-lg text-display-lg text-on-surface mb-2">
          nitisaathi
        </Text>
        <Text className="font-body-md text-body-md text-text-warm-gray">
          आपका वित्तीय साथी / Your financial companion
        </Text>
      </View>

      <View className="w-full flex-col gap-stack-md">
        <Text className="font-headline-sm text-headline-sm text-on-surface text-center mb-stack-sm">
          Choose your language / अपनी भाषा चुनें
        </Text>

        <View className="flex-row justify-between gap-stack-sm">
          <View className="flex-1">
            <OnboardingOptionCard
              value="hi"
              title="हिंदी"
              subtitle="Hindi"
              isSelected={selectedLanguage === 'hi'}
              onSelect={handleLanguageSelect}
              variant="language"
            />
          </View>
          <View className="flex-1">
            <OnboardingOptionCard
              value="en"
              title="A"
              subtitle="English"
              isSelected={selectedLanguage === 'en'}
              onSelect={handleLanguageSelect}
              variant="language"
            />
          </View>
          <View className="flex-1">
            <OnboardingOptionCard
              value="mr"
              title="म"
              subtitle="मराठी"
              isSelected={selectedLanguage === 'mr'}
              onSelect={handleLanguageSelect}
              variant="language"
            />
          </View>
        </View>

        <View className="flex-col gap-3 mt-4 w-full">
          <Text className="font-label-lg text-label-lg text-on-surface">Account Details</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
            className="w-full h-12 bg-background-off-white rounded px-4 text-on-surface border border-transparent focus:border-vivid-red"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            className="w-full h-12 bg-background-off-white rounded px-4 text-on-surface border border-transparent focus:border-vivid-red"
          />
        </View>

        <Pressable
          onPress={handleNext}
          className="w-full bg-secondary-container rounded-lg py-4 px-6 mt-stack-sm flex-row items-center justify-center gap-2 shadow-sm active:opacity-90"
        >
          <Text className="text-on-primary font-label-lg text-label-lg">
            आगे बढ़ें / Continue
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
        </Pressable>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View className="mb-10 text-center items-center">
        <Text className="font-headline-lg text-headline-lg text-on-surface mb-2 text-center">
          वित्तीय शब्दों के साथ आप कितने सहज हैं?
        </Text>
        <Text className="font-body-md text-body-md text-text-warm-gray text-center">
          How comfortable are you with financial terms?
        </Text>
      </View>

      <View className="flex-col gap-4 w-full">
        <OnboardingOptionCard
          value="beginner"
          title="मुझे ज्यादातर शब्द समझ नहीं आते, सरल भाषा में बताएं"
          subtitle="I don't understand most terms, please keep it simple"
          isSelected={comfortLevel === 'beginner'}
          onSelect={setComfortLevel}
          variant="literacy"
        />
        <OnboardingOptionCard
          value="intermediate"
          title="मुझे कुछ शब्द पता हैं, पर पूरी जानकारी नहीं"
          subtitle="I know some terms but not all the details"
          isSelected={comfortLevel === 'intermediate'}
          onSelect={setComfortLevel}
          variant="literacy"
        />
        <OnboardingOptionCard
          value="advanced"
          title="मुझे वित्तीय शब्द अच्छे से समझ आते हैं"
          subtitle="I'm comfortable with financial terminology"
          isSelected={comfortLevel === 'advanced'}
          onSelect={setComfortLevel}
          variant="literacy"
        />
      </View>

      <Pressable
        onPress={handleNext}
        className="w-full bg-vivid-red rounded-lg py-4 px-6 mt-4 flex-row items-center justify-center gap-2 shadow-sm active:opacity-90"
      >
        <Text className="text-white font-label-lg text-label-lg">
          आगे बढ़ें / Continue
        </Text>
        <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
      </Pressable>
    </>
  );

  const renderStep3 = () => (
    <>
      <View className="mb-10 text-center items-center">
        <Text className="font-headline-lg text-headline-lg text-on-surface mb-2 text-center">
          आपकी जानकारी / Your Details
        </Text>
        <Text className="font-body-md text-body-md text-text-warm-gray text-center">
          यह जानकारी सही योजनाएं दिखाने में मदद करती है / This helps us show you the right schemes.
        </Text>
      </View>

      <View className="flex-col gap-8 w-full">
        {/* Row 1: Age & Income */}
        <View className="flex-col md:flex-row gap-6 w-full">
          <View className="flex-col gap-2 flex-1">
            <Text className="font-label-lg text-label-lg text-on-surface">उम्र / Age</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="e.g. 32"
              placeholderTextColor="#6B6560"
              className="w-full h-12 bg-background-off-white rounded px-4 text-on-surface border border-transparent focus:border-vivid-red"
            />
            <Text className="font-label-sm text-label-sm text-text-warm-gray">
              कुछ सरकारी योजनाओं की उम्र सीमा होती है / Some schemes have age limits
            </Text>
          </View>
          <View className="flex-col gap-2 flex-1">
            <Text className="font-label-lg text-label-lg text-on-surface">
              पिछले महीने की अनुमानित कमाई / Approximate income last month
            </Text>
            <View className="flex-row h-12 bg-background-off-white rounded items-center px-4 border border-transparent focus-within:border-vivid-red">
              <Text className="text-on-surface-variant font-body-md mr-2">₹</Text>
              <TextInput
                value={income}
                onChangeText={setIncome}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#6B6560"
                className="flex-1 h-full bg-transparent text-on-surface"
              />
            </View>
          </View>
        </View>

        {/* State */}
        <View className="flex-col gap-3 w-full">
          <Text className="font-label-lg text-label-lg text-on-surface">राज्य / State</Text>
          <TextInput
            value={stateName}
            onChangeText={setStateName}
            placeholder="e.g. Maharashtra"
            placeholderTextColor="#6B6560"
            className="w-full h-12 bg-background-off-white rounded px-4 text-on-surface border border-transparent focus:border-vivid-red"
          />
        </View>

        {/* Row 2: Platforms */}
        <View className="flex-col gap-3 w-full">
          <Text className="font-label-lg text-label-lg text-on-surface">
            आप किस प्लेटफॉर्म पर काम करते हैं? / Which platform(s) do you work with?
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {['Swiggy', 'Zomato', 'Ola', 'Uber', 'Rapido', 'Other'].map(plat => (
              <PlatformChip
                key={plat}
                label={plat}
                selected={platforms.includes(plat)}
                onPress={() => {
                  if (platforms.includes(plat)) {
                    setPlatforms(platforms.filter(p => p !== plat));
                  } else {
                    setPlatforms([...platforms, plat]);
                  }
                }}
              />
            ))}
          </View>
        </View>
        
        <View className="flex-col gap-3 w-full">
          <Text className="font-label-lg text-label-lg text-on-surface">Days Active with Aggregator</Text>
          <TextInput
            value={daysActive}
            onChangeText={setDaysActive}
            keyboardType="numeric"
            placeholder="e.g. 150"
            placeholderTextColor="#6B6560"
            className="w-full h-12 bg-background-off-white rounded px-4 text-on-surface border border-transparent focus:border-vivid-red"
          />
        </View>

        {/* Row 3: EMI & e-Shram */}
        <View className="flex-col md:flex-row gap-6 pt-4 border-t border-surface-container-highest w-full">
          <View className="flex-col gap-3 flex-1">
            <Text className="font-label-lg text-label-lg text-on-surface">
              क्या आपकी कोई EMI चल रही है? / Ongoing EMI?
            </Text>
            <SegmentedControl
              options={['Yes', 'No']}
              selected={emi}
              onSelect={setEmi}
            />
          </View>
          <View className="flex-col gap-3 flex-1">
            <Text className="font-label-lg text-label-lg text-on-surface">
              क्या आप e-Shram में रजिस्टर्ड हैं? / Registered with e-Shram?
            </Text>
            <SegmentedControl
              options={['Yes', 'No', 'Not sure']}
              selected={eShram}
              onSelect={setEShram}
            />
          </View>
        </View>

        {/* Row 4: EPFO/ESIC */}
        <View className="flex-col gap-3 pt-4 border-t border-surface-container-highest w-full">
          <Text className="font-label-lg text-label-lg text-on-surface">
            क्या आप EPFO/ESIC में रजिस्टर्ड हैं? / Registered with EPFO/ESIC?
          </Text>
          <SegmentedControl
            options={['Yes', 'No', 'Not sure']}
            selected={epfoEsic}
            onSelect={setEpfoEsic}
          />
        </View>

        {/* Savings & Aadhaar */}
        <View className="flex-col md:flex-row gap-6 pt-4 border-t border-surface-container-highest w-full">
          <View className="flex-col gap-3 flex-1">
            <Text className="font-label-lg text-label-lg text-on-surface">
              Savings Bank Account?
            </Text>
            <SegmentedControl
              options={['Yes', 'No']}
              selected={savingsBankAccount}
              onSelect={setSavingsBankAccount}
            />
          </View>
          <View className="flex-col gap-3 flex-1">
            <Text className="font-label-lg text-label-lg text-on-surface">
              Aadhaar Linked?
            </Text>
            <SegmentedControl
              options={['Yes', 'No']}
              selected={aadhaarLinked}
              onSelect={setAadhaarLinked}
            />
          </View>
        </View>

      </View>

      <Pressable
        onPress={handleNext}
        className="w-full bg-vivid-red rounded-lg py-4 px-6 mt-8 flex-row items-center justify-center gap-2 shadow-sm active:opacity-90"
      >
        <Text className="text-white font-label-lg text-label-lg">
          आगे बढ़ें / Continue
        </Text>
        <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
      </Pressable>
    </>
  );

  const renderStep4 = () => (
    <>
      <View className="mb-stack-lg text-center items-center">
        <Text className="font-headline-lg text-headline-lg text-on-background mb-stack-sm text-center">
          आपकी सहमति / Your Consent
        </Text>
        <Text className="font-body-md text-body-md text-on-surface-variant text-center">
          आप हर एक को अलग से चालू या बंद कर सकते हैं, कभी भी बदल सकते हैं / {'\n'}
          You can turn each on or off separately, anytime in Settings.
        </Text>
      </View>

      <View className="flex-col gap-4 mb-stack-lg w-full">
        <ToggleRow 
          title="लेनदेन जानकारी / Transaction data" 
          description="आपकी income और खर्च ट्रैक करने के लिए" 
          value={consentTransaction} 
          onValueChange={setConsentTransaction} 
        />
        <ToggleRow 
          title="योजना पात्रता जांच / Scheme eligibility check" 
          description="सही सरकारी योजनाएं दिखाने के लिए आपकी प्रोफाइल का उपयोग" 
          value={consentEligibility} 
          onValueChange={setConsentEligibility} 
        />
        <ToggleRow 
          title="धोखाधड़ी सुरक्षा / Fraud detection" 
          description="संदिग्ध लेनदेन की जांच के लिए" 
          value={consentFraud} 
          onValueChange={setConsentFraud} 
        />
        <ToggleRow 
          title="सूचनाएं / Push notifications" 
          description="समय पर अलर्ट भेजने के लिए" 
          value={consentNotifications} 
          onValueChange={setConsentNotifications} 
        />
        <ToggleRow 
          title="मासिक रिपोर्ट / Monthly PDF report + email" 
          description="आपकी मासिक रिपोर्ट ईमेल पर भेजने के लिए" 
          value={consentReports} 
          onValueChange={setConsentReports} 
        />
      </View>

      <View className="w-full flex-col border-t border-surface-variant pt-stack-md mt-stack-md items-center">
        <Pressable
          onPress={handleNext}
          className="w-full bg-vivid-red rounded-lg py-3 flex-row items-center justify-center gap-2 shadow-sm mb-2 active:opacity-90"
        >
          <Text className="text-white font-label-lg text-label-lg">
            शुरू करें / Get Started
          </Text>
        </Pressable>
        <Text className="font-label-sm text-label-sm text-on-surface-variant opacity-75 text-center">
          आप बाद में इन्हें चालू कर सकते हैं / You can turn these on later
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-off-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View className={`bg-surface-container-lowest w-full rounded-xl shadow-[0px_4px_20px_rgba(26,26,26,0.05)] flex-col relative overflow-hidden ${
          currentStep >= 3 ? 'max-w-[600px] p-stack-lg' : 'max-w-[480px] ' + (currentStep === 1 ? 'p-6 items-center' : 'p-stack-lg')
        }`}>
          
          <StepIndicator 
            currentStep={currentStep} 
            totalSteps={4} 
            onBack={handleBack} 
          />

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
