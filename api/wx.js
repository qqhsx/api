import { TextDecoder } from "util";
import crypto from "crypto";
import xml2js from "xml2js";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

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

// 从小宇搜索抓取结果
async function searchXyk(keyword) {
  try {
    const url = `https://xykmovie.com/?s=${encodeURIComponent(keyword)}`;
    const resp = await fetch(url);
    const html = await resp.text();

    const $ = cheerio.load(html);

    // 找到第一个 data-code
    const firstLink = $("a.copy").attr("data-code");
    if (firstLink) {
      return `搜索【${keyword}】结果：${firstLink}`;
    } else {
      return `搜索【${keyword}】没有找到可用结果`;
    }
  } catch (e) {
    console.error("搜索出错:", e);
    return "搜索出错，请稍后再试";
  }
}

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

    // 调用小宇搜索
    const replyContent = await searchXyk(content);

    const replyXML = buildTextReply(toUser, fromUser, replyContent);
    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(replyXML);
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
