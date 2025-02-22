const axios = require("axios");
const { json } = require("body-parser");
require('dotenv').config();

const Graph_API_Token = process.env.GRAPH_API_TOKEN;
const Webhook_Verify_Token = process.env.WEBHOOK_VERIFY_TOKEN;

exports.WEBHOOK_CALLBACK = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
  
    // Check if the mode and token are correct
    if (mode === 'subscribe' && token === Webhook_Verify_Token) {
      console.log('Webhook Verified Successfully');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
}

exports.WEBHOOK_EVENT_HANDLER = async (req, res) => {

    const messageObject = req.body;
    axios({
        method: "POST",
        url: `https://3ppf5wn4-4000.inc1.devtunnels.ms/api/v1/handle_whatsapp`,
        data: messageObject,
        headers: {
            "Content-Type": "application/json"
        }
    })

    return res.status(200).json({ status: "Message received", "messageId": "" });

    if (messageObject.object) {
        if (messageObject.entry && messageObject.entry[0].changes && messageObject.entry[0].changes[0].value.messages &&
            messageObject.entry[0].changes[0].value.messages[0]) {

            const changeValue = messageObject.entry[0].changes[0].value;
            const metadata = changeValue.metadata;
            const phoneNumberId = metadata.phone_number_id;

            console.log(String(changeValue));

            if (changeValue.messages && changeValue.messages[0]) {
                const message = changeValue.messages[0];
                const messageId = message.id; 
                const from = message.from;
                const senderNumber = changeValue.contacts[0].wa_id;

                if (message.text) {
                    const messageBody = message.text.body;  
                    console.log(messageBody);
                    res.status(200).json({ status: "Message received", messageId });
                } 
                
                else if (message.interactive && message.interactive.button_reply) {
                    const buttonReply = message.interactive.button_reply;
                    const buttonId = buttonReply.id; 
                    const buttonText = buttonReply.title;

                    const replyMessage = "Thank you 😊";

                    axios({
                        method: "POST",
                        url: `https://graph.facebook.com/v20.0/${phoneNumberId}/messages?access_token=${Graph_API_Token}`,
                        data: {
                            messaging_product: "whatsapp",
                            to: from,
                            text: {
                                body: replyMessage
                            }
                        },
                        headers: {
                            "Content-Type": "application/json"
                        }
                    })
                    .then(response => {
                        console.log("Message sent successfully:", response.data);
                        res.status(200).json({ status: "success", data: response.data });
                    })
                    .catch(error => {
                        console.error("Error sending message:", error);
                        res.status(500).json({ status: "error", message: "Failed to send messagesss" });
                    });
            
                    res.status(200).json({ status: "true"});
                }
            } else {
                res.sendStatus(404); 
            }

        } else {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(404);
    }
}