import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';

export function EmptyDashboard() {
  return (
    <View className="flex-1 bg-surface-bright items-center justify-center p-8 mt-12">
      <View className="w-full max-w-[480px] flex-col items-center justify-center">
        
        {/* Illustration */}
        <View className="w-64 h-64 md:w-80 md:h-80 items-center justify-center mb-8">
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida/AP1WRLs3B7w5JR1nWR_dYHyQ_22jPqhWw1-00FpuyFKVQRPoeO39a_b4oxtjB_qgDShEqMS0mVYqqqHF7O7bKcMNHoe_ACkiQOV1eCusE61so_09FX5BnwKu3_QyA1EsUr5iBbFnmiTGVSvwG1xMbQCGvtu37mjX5067vZNmu8NGddJ85dsStP6C2K37jmLRUZKTI15kneskloJLs0I9tF8myAltsGCAxd9iydjLGWYxcy1opWUwLDii-hopjoex' }} 
            className="w-full h-full"
            resizeMode="contain"
          />
        </View>

        {/* Text Content */}
        <View className="px-4 mb-8 items-center">
          <Text className="font-headline-lg text-headline-lg text-on-surface text-center">
            आइए शुरू करते हैं
          </Text>
          <Text className="text-primary-container font-headline-md text-headline-md text-center mt-1">
            Let's get started
          </Text>
          
          <Text className="font-body-lg text-body-lg text-text-warm-gray mt-4 text-center">
            अपने लेनदेन जोड़ें ताकि हम आपकी मदद कर सकें
          </Text>
          <Text className="text-sm text-text-warm-gray text-center mt-1">
            Add your transactions so we can start helping you
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-col items-center gap-4 w-full">
          <Pressable className="bg-vivid-red py-4 px-10 rounded-lg shadow-sm active:opacity-80 flex-row items-center justify-center min-w-[280px]">
            <Text className="text-white font-label-lg text-label-lg text-center">
              लेनदेन जोड़ें / Connect Transactions
            </Text>
          </Pressable>
          <Pressable className="mt-2 p-2">
            <Text className="text-on-surface-variant font-label-md text-center underline">
              बाद में करें / Do this later
            </Text>
          </Pressable>
        </View>
        
      </View>
    </View>
  );
}
