import crypto from "crypto";
import { parseString } from "xml2js";

// 你在微信公众平台配置的 Token
const TOKEN = "weixin";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // 微信服务器验证
    const { signature, timestamp, nonce, echostr } = req.query;

    const tmpArr = [TOKEN, timestamp, nonce].sort();
    const tmpStr = tmpArr.join("");
    const hash = crypto.createHash("sha1").update(tmpStr).digest("hex");

    if (hash === signature) {
      res.status(200).send(echostr);
    } else {
      res.status(403).send("Invalid signature");
    }
  } else if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      console.log("收到微信消息：", body);

      // 解析 XML
      parseString(body, { explicitArray: false }, (err, result) => {
        if (err) {
          res.status(400).send("Invalid XML");
          return;
        }

        const msg = result.xml;
        const fromUser = msg.FromUserName;
        const toUser = msg.ToUserName;

        // 构造回复（交换 from/to）
        const reply = `
          <xml>
            <ToUserName><![CDATA[${fromUser}]]></ToUserName>
            <FromUserName><![CDATA[${toUser}]]></FromUserName>
            <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
            <MsgType><![CDATA[text]]></MsgType>
            <Content><![CDATA[你发了: ${msg.Content || "其他消息"}]]></Content>
          </xml>
        `;

        res.setHeader("Content-Type", "application/xml");
        res.status(200).send(reply);
      });
    });
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
