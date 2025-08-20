import { TextDecoder } from "util";
import crypto from "crypto";
import xml2js from "xml2js";

export const config = { api: { bodyParser: false } };
const TOKEN = "weixin";

// 解析 XML
async function parseXML(xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(
      xml,
      { trim: true, explicitArray: false, explicitRoot: false },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
}

// 构建文本回复
function buildTextReply(toUser, fromUser, content) {
  const time = Math.floor(Date.now() / 1000);
  return `<xml>
    <ToUserName><![CDATA[${toUser}]]></ToUserName>
    <FromUserName><![CDATA[${fromUser}]]></FromUserName>
    <CreateTime>${time}</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[${content}]]></Content>
  </xml>`;
}

// 校验 signature
function checkSignature(query) {
  const { signature, timestamp, nonce } = query;
  const arr = [TOKEN, timestamp, nonce].sort();
  const str = arr.join("");
  const hash = crypto.createHash("sha1").update(str).digest("hex");
  return hash === signature;
}

// 关键词回复字典
const keywordReplies = {
  "女性瘾者": "女性瘾者1-2（迅雷）链接：https://pan.xunlei.com/s/VNGqrIpAg2pPRHX6ZZmzacNdA1# 提取码：r5yn",
  "测试": "这是测试自动回复内容",
  // 可以继续添加更多关键词和对应内容
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { echostr } = req.query;
    if (checkSignature(req.query)) {
      res.status(200).send(echostr || "ok");
    } else {
      res.status(403).send("Invalid signature");
    }
  } else if (req.method === "POST") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);
    const body = new TextDecoder("utf-8").decode(rawBody);

    let msg;
    try {
      msg = await parseXML(body);
    } catch (e) {
      res.status(400).send("Bad Request");
      return;
    }

    const toUser = msg.FromUserName || "user";
    const fromUser = msg.ToUserName || "server";
    const content = (msg.Content || "").trim();

    // 根据关键词回复内容
    let replyContent = keywordReplies[content] || "未匹配到关键词，默认回复：收到消息！";

    const replyXML = buildTextReply(toUser, fromUser, replyContent);
    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(replyXML);
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
