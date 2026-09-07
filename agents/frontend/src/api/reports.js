export const getReports = async (isEmpty = false) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (isEmpty) {
        resolve([]);
      } else {
        resolve([
          {
            id: 'r1',
            title: 'July 2024',
            generatedDate: '2 July 2024',
            status: 'ready',
            statusHindi: 'डाउनलोड के लिए तैयार',
            statusEnglish: 'Ready to download',
            icon: 'check-circle'
          },
          {
            id: 'r2',
            title: 'Q2 2024',
            generatedDate: '1 July 2024',
            status: 'emailed',
            statusHindi: 'ईमेल भेजा गया',
            statusEnglish: 'Emailed',
            icon: 'mail'
          }
        ]);
      }
    }, 500);
  });
};
