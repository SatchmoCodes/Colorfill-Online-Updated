export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  gameId: string
) => {
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title,
        body,
        data: {
          gameId,
        },
        priority: "high",
      }),
    });
  } catch (error) {
    console.log("error sending notification: ", error);
  }
};
