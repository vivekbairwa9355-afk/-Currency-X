// Chatbot — independent file so it keeps working even if other code has a problem
(function(){
  const el = id => document.getElementById(id);
  const chat = el("chat"), bodyEl = el("chatBody"), input = el("chatText");
  const R = () => (typeof rates !== "undefined" ? rates : {});
  const C = () => (typeof COUNTRIES !== "undefined" ? COUNTRIES : []);
  const fmtN = n => Number(n).toLocaleString(undefined,{maximumFractionDigits:4});
  const listJoin = (a, max=10) => a.slice(0,max).join(", ") + (a.length > max ? ` and ${a.length-max} more` : "");

  // ---- FAQ: [pattern, answer]. Checked in order, first match wins ----
  const FAQ = [
    [/\b(hi|hello|hey|namaste)\b|good (morning|afternoon|evening)/, "Hi! 👋 I'm the Currency Assistant. Ask me to convert money (50 eur to gbp), find a country's currency, or ask any basic question about currencies."],
    [/\b(bye|goodbye|see you)\b/, "Goodbye! 👋 Come back anytime you need a conversion."],
    [/thank|thanks|great|awesome|nice/, "You're welcome! 😊 Anything else I can help with?"],
    [/what (is|does) (this|the) (site|website|project|app|converter)|about (this|the) (site|website|project)|what can you do|\bhelp\b/, "CurrencyX converts money between 190+ countries using live exchange rates. You can search any country, see its flag and currency, convert, copy the result and view recent conversions. I can answer basic currency questions too."],
    [/what is (an? )?(currency|money)\b|currency mean|define currency/, "A currency is the official money of a country, such as the Indian Rupee (INR) in India or the US Dollar (USD) in the United States."],
    [/what is (an? )?exchange rate|exchange rate (mean|definition)|meaning of exchange rate/, "An exchange rate tells you how much of one currency you get for another. For example, if 1 USD = 83 INR, one dollar buys 83 rupees."],
    [/why.*(rate|price|value).*(change|differ|fluctuat|move|up|down)|fluctuat|volatil|why do rates/, "Exchange rates move because of demand and supply, interest rates, inflation, economic news, trade, and political events. They can change every second."],
    [/\bfree\b|any cost|is it paid|subscription|sign.?up|login|register/, "Yes, CurrencyX is completely free. No sign-up or login is needed."],
    [/bank|markup|spread|commission|hidden|fees?\b|charges?\b/, "This site never charges a fee. But banks, airports and money changers usually add a margin (markup) or fee on top of the market rate, so the amount you actually receive can be lower than the rate shown here."],
    [/buy(ing)? rate|sell(ing)? rate|buy and sell|buy vs sell/, "Money changers show two rates: a buying rate (what they pay you for foreign cash) and a selling rate (what they charge you). The selling rate is higher. The rate on this site is the mid-market rate, in between the two."],
    [/mid.?market|real rate|market rate/, "The mid-market rate is the real exchange rate between two currencies, without any bank markup. That is the kind of rate this site shows."],
    [/best time|when (to|should).*(exchange|convert|send|change)/, "Nobody can predict rates exactly. Watch the rate for a few days, avoid exchanging in a hurry at the airport, and compare a few providers before you convert."],
    [/travel|trip|abroad|airport|tourist|holiday|vacation|cash or card|credit card|forex card/, "Travel tips: carry a little local cash, use a card with low foreign-transaction fees, avoid airport exchange counters (rates are poor), and always compare the rate with the one on this site."],
    [/send money|transfer|remit|wire|international payment/, "For sending money abroad, compare the exchange rate AND the transfer fee from different providers. Use this site to check the fair mid-market rate first."],
    [/how often|refresh|real.?time|latest|up to date|updated/, "Rates are fetched when the page loads and the 'Rates last updated' time is shown inside the converter box. Refresh the page to get the newest rates."],
    [/accura|exact|official|reliable|trust|correct rate|precise/, "Rates come from a public exchange-rate API and are indicative only. Actual rates at banks or exchange counters can differ slightly."],
    [/offline|no internet|without internet|no network/, "Without internet, the site uses saved approximate rates for about 40 major currencies. Other currencies show 'Rate not available' until you are online."],
    [/privacy|my data|personal|secure|safe\b|is it safe/, "We don't ask for any personal information. Your recent conversions are saved only in your own browser and you can clear them anytime."],
    [/history|recent conversion|previous conversion/, "Press Convert and your last 5 conversions appear in the 'Recent conversions' list inside the converter box. Click Clear to remove them."],
    [/swap|reverse|flip|interchange/, "Click the ⇄ button between the two countries to swap From and To."],
    [/\bcopy\b/, "Click the 📋 Copy button to copy the result, then paste it anywhere."],
    [/reset|start over|clear (all|the form)/, "Click ↺ Reset to go back to the default USD → INR conversion with amount 1."],
    [/search|find (a )?country|flag|dropdown|select country|choose country/, "Click the From or To box and type a country name or currency code, like 'Japan' or 'JPY'. Each country shows its flag."],
    [/how many (countries|currencies)|number of (countries|currencies)|supported|list of countries/, () => `This site supports ${C().length || 198} countries and about 146 currencies.`],
    [/highest|strongest|most valuable|costliest|costly|expensive/, "The Kuwaiti Dinar (KWD) has the highest value per unit, followed by the Bahraini Dinar (BHD) and Omani Rial (OMR)."],
    [/lowest|weakest|cheapest|least valuable/, "Currencies like the Iranian Rial, Vietnamese Dong and Lao Kip have very low value per unit. Low value per unit doesn't mean a weak economy, it depends on how a country counts its money."],
    [/most traded|most popular|most used/, "The US Dollar (USD) is the most traded currency in the world, followed by the Euro (EUR) and the Japanese Yen (JPY)."],
    [/reserve currency|reserve/, "A reserve currency is held by central banks in large amounts for international trade. The US Dollar is the main reserve currency, followed by the Euro."],
    [/peg(ged)?\b/, "A pegged currency has its value fixed to another currency, usually the US Dollar. For example AED, SAR, QAR, BHD and OMR are pegged to USD."],
    [/symbol|sign of|sign for/, "Common symbols: $ US Dollar, € Euro, £ British Pound, ₹ Indian Rupee, ¥ Japanese Yen / Chinese Yuan, ₩ Korean Won, ₽ Russian Ruble, ₺ Turkish Lira, ฿ Thai Baht, ₦ Nigerian Naira."],
    [/\biso\b|currency code|three.?letter|3.?letter|code mean|what are codes/, "Every currency has a 3-letter ISO code, like USD, EUR, INR or JPY. The first two letters are usually the country and the third is the currency name."],
    [/forex|\bfx\b|foreign exchange|currency trading/, "Forex (foreign exchange) is the global market where currencies are traded. It is the biggest financial market, with over $7 trillion traded every day."],
    [/crypto|bitcoin|btc|ethereum|\beth\b|gold|silver|stock/, "Sorry, this site only converts government (fiat) currencies. Crypto, gold and stocks are not supported."],
    [/inflation/, "Inflation is the rise in prices over time. Higher inflation usually reduces a currency's buying power and can weaken it against other currencies."],
    [/devalu|depreciat|appreciat/, "Devaluation or depreciation means a currency loses value against others. Appreciation means it gains value."],
    [/central bank|\brbi\b|federal reserve|\bfed\b|\becb\b/, "A central bank (like the RBI in India, the Fed in the USA or the ECB in Europe) controls money supply and interest rates, which strongly affect currency value."],
    [/euro ?zone|which countries.*euro|why.*euro/, "The Euro (EUR) is used by many European countries such as Germany, France, Italy and Spain. On this site each of them has its own flag but the same currency."],
    [/dollari|ecuador|el salvador/, "Some countries like Ecuador and El Salvador use the US Dollar as their official currency. This is called dollarization."],
    [/base currency|cross rate|quote currency/, "In a pair like USD/INR, USD is the base currency and INR is the quote currency. A cross rate is the rate between two currencies calculated through a third one, usually USD."],
    [/decimal|round|precision|digits/, "Results show up to 4 decimal places, and the exchange rate shows up to 6 for better precision."],
    [/mobile|phone|android|iphone|tablet/, "Yes, the website is responsive and works on phones, tablets and computers."],
    [/contact|support|bug|error|not working|problem|issue|complain/, "Sorry about the trouble! Try refreshing the page first. For project support, please contact the team: Vivek Bairwa, Sani Raj, Vanshika and Vanshika Mehta."],
    [/team|member|who (made|built|created|developed)|creator|developer|made this|built this/, "Built by Vanshika, Vanshika Mehta, Sani Raj and Vivek Bairwa."],
    [/technolog|tech stack|html|css|javascript|built with|api\b|source/, "CurrencyX uses HTML5, CSS3 and JavaScript for the website, a free exchange-rate API for live rates and flagcdn for flags."],
    [/how|use|work|step|guide|tutorial|convert money/, "1) Pick From and To countries (use the search box). 2) Enter an amount. 3) Press Convert. Use ⇄ to swap and 📋 to copy the result."]
  ];

  function currencyInfo(code){
    const list = C().filter(c => c.code === code);
    if(!list.length) return null;
    return `${code} is the ${list[0].cur}. Used in: ${listJoin(list.map(c => c.country), 8)}.`;
  }

  function reply(q){
    q = q.toLowerCase().replace(/[?!.]+$/,"").trim();
    const r = R(), list = C();

    // 1) conversions: "100 usd to inr" or "usd to inr"
    const m = q.match(/(?:(\d+(?:\.\d+)?)\s*)?\b([a-z]{3})\s*(?:to|in|into|->|=)\s*([a-z]{3})\b/);
    if(m){
      const F = m[2].toUpperCase(), T = m[3].toUpperCase(), amt = m[1] ? +m[1] : 1;
      if(r[F] && r[T]) return `${fmtN(amt)} ${F} = ${fmtN(amt*r[T]/r[F])} ${T}`;
      if(m[1]) return "I couldn't find one of those currency codes. Try: 100 usd to inr";
    }

    // 2) "currency of japan"
    const cm = q.match(/currency (?:of|in|for|used in)\s+([a-z .]+)/) || q.match(/^([a-z .]{3,})\s+currency$/);
    if(cm){
      const nm = cm[1].trim();
      const c = list.find(x => x.country.toLowerCase() === nm) || list.find(x => x.country.toLowerCase().includes(nm));
      if(c) return `${c.country} uses the ${c.cur} (${c.code}).`;
      if(/currency (of|in|for|used)/.test(q)) return "I couldn't find that country. Check the spelling and try again.";
    }

    // 3) "which countries use euro / usd"
    const um = q.match(/(?:use|uses|using)\s+(?:the\s+)?([a-z ]+)$/);
    if(um && /countr|who|which/.test(q)){
      const w = um[1].trim();
      const hits = list.filter(c => c.code.toLowerCase() === w || c.cur.toLowerCase() === w || c.cur.toLowerCase().includes(w));
      if(hits.length){ const codes = [...new Set(hits.map(h => h.code))];
        if(codes.length === 1) return `${listJoin(hits.map(h => h.country), 12)} use the ${hits[0].cur} (${codes[0]}).`;
        return `"${w}" matches several currencies (${listJoin(codes,6)}). Please use the 3-letter code, e.g. "which countries use usd".`; }
    }

    // 4) "what is inr" / bare code
    const im = q.match(/^(?:what is|what's|about|tell me about|full form of|meaning of)?\s*(?:the\s+)?([a-z]{3})$/);
    if(im){ const info = currencyInfo(im[1].toUpperCase()); if(info) return info; }

    // 5) FAQ
    for(const [re, ans] of FAQ){ if(re.test(q)) return typeof ans === "function" ? ans() : ans; }
    return "Sorry, I didn't get that. Try: 'how to use', 'is it free', 'exchange rate meaning', 'travel tips', 'currency of Japan', 'which countries use eur' or '100 usd to inr'.";
  }

  function say(text, who){
    const m = document.createElement("div");
    m.className = "msg " + who; m.textContent = text;
    bodyEl.appendChild(m); bodyEl.scrollTop = bodyEl.scrollHeight;
  }
  function send(text){
    const v = (text !== undefined ? text : input.value).trim();
    if(!v) return;
    say(v, "me"); input.value = "";
    setTimeout(() => { let a; try{ a = reply(v); }catch(e){ a = "Sorry, something went wrong. Please try again."; } say(a, "bot"); }, 300);
  }

  el("chatSend").addEventListener("click", () => { send(); input.focus(); });
  input.addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); send(); } });
  ["How to use","Is it free?","What is exchange rate?","Highest currency","Travel tips","Currency of Japan","Which countries use EUR","100 usd to inr","Currency symbols","Bank fees","Why rates change","Team"].forEach(t => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = t;
    b.addEventListener("click", () => send(t)); el("chatChips").appendChild(b);
  });
  el("chatFab").addEventListener("click", () => {
    chat.classList.toggle("open");
    if(chat.classList.contains("open")){
      if(!bodyEl.children.length) say("Hello! 👋 I'm the Currency Assistant. Type a question below or tap a suggestion.","bot");
      setTimeout(() => input.focus(), 50);
    }
  });
  el("chatClose").addEventListener("click", () => chat.classList.remove("open"));
})();