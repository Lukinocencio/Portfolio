import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

// Anti-Spam: Cache de IPs em memória (por instância lambda) com limpeza automática
const ipRateLimit = new Map();
const MAX_RATE_LIMIT_ENTRIES = 200;
const RATE_LIMIT_WINDOW_MS = 60000; // 60 segundos

const cleanupRateLimitMap = (now) => {
  if (ipRateLimit.size > MAX_RATE_LIMIT_ENTRIES) {
    for (const [key, timestamp] of ipRateLimit.entries()) {
      if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
        ipRateLimit.delete(key);
      }
    }
  }
};

// Função auxiliar para sanitizar (escapar HTML) de forma básica
const escapeHTML = (str) => {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag])
  );
};

export async function POST(req) {
  try {
    // Obter IP para Rate Limiting (extrai primeiro IP confiável)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const now = Date.now();
    
    cleanupRateLimitMap(now);

    // Regra Anti-Spam: Bloqueia IPs que tentarem enviar mais de 1 email em menos de 1 minuto
    if (ipRateLimit.has(ip)) {
      const lastRequestTime = ipRateLimit.get(ip);
      if (now - lastRequestTime < RATE_LIMIT_WINDOW_MS) {
        return NextResponse.json({ error: "Limite de tentativas excedido. Tente novamente em 1 minuto." }, { status: 429 });
      }
    }
    ipRateLimit.set(ip, now);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
    }

    const { name, email, tel, subject, message, _honeypot } = body;

    // Anti-Spam: Verifica Campo Armadilha (Honeypot)
    if (_honeypot) {
      return NextResponse.json({ message: "E-mail enviado com sucesso!" }, { status: 200 }); // Retorna sucesso falso pro bot
    }

    // Validação estrita de tipos
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: "Campos obrigatórios faltando ou em formato inválido." }, { status: 400 });
    }

    if (tel !== undefined && typeof tel !== 'string') {
      return NextResponse.json({ error: "Campo de telefone em formato inválido." }, { status: 400 });
    }

    if (subject !== undefined && typeof subject !== 'string') {
      return NextResponse.json({ error: "Campo de assunto em formato inválido." }, { status: 400 });
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
    }

    if (name.length > 100 || email.length > 100 || (subject && subject.length > 150) || message.length > 3000) {
      return NextResponse.json({ error: "Os dados excedem o limite de caracteres permitido." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "O endereço de e-mail fornecido é inválido." }, { status: 400 });
    }

    // Sanitização de entradas (XSS, Injeções HTML e mitigação de CRLF Injection)
    const sanitizedName = name.replace(/[\r\n]/g, '').trim();
    const safeName = escapeHTML(sanitizedName);
    const safeEmail = escapeHTML(email.replace(/[\r\n]/g, '').trim());
    const safeTel = escapeHTML(tel ? tel.replace(/[\r\n]/g, '').trim() : '');
    const safeSubject = escapeHTML(subject ? subject.replace(/[\r\n]/g, '').trim() : '');
    const safeMessage = escapeHTML(message).replace(/\n/g, '<br>');

    const output = `
      <p>Você tem um novo pedido de contato</p>
      <h3>Detalhes do Contato</h3>
      <ul>
          <li>Nome: ${safeName}</li>
          <li>E-mail: ${safeEmail}</li>
          <li>Telefone: ${safeTel}</li>
          <li>Assunto: ${safeSubject}</li>
      </ul>
      <h3>Mensagem</h3>
      <p>${safeMessage}</p>
    `;
    
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465, // true para 465, false para outras portas
        connectionTimeout: 10000, // 10 segundos
        greetingTimeout: 5000,   // 5 segundos
        socketTimeout: 15000,    // 15 segundos
        auth: {
            user: process.env.EMAIL_USUARIO,
            pass: process.env.SENHA_EMAIL
        },
        tls: {
            rejectUnauthorized: true // Validação rigorosa de certificados TLS contra MitM
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM, // Seu no-reply@harmonysoftware.com.br
        to: process.env.EMAIL_TO,     // Destinos separados por vírgula
        replyTo: email.trim().replace(/[\r\n]/g, ''), // E-mail limpo sem quebras de linha
        subject: `Portfolio - Contato de ${sanitizedName}`,
        html: output
    };

    await transporter.sendMail({
      ...mailOptions,
      signal: AbortSignal.timeout(15000)
    });
    return NextResponse.json({ message: "E-mail enviado com sucesso!" }, { status: 200 });

  } catch (error) {
    console.error("Erro ao enviar o e-mail: ", error);
    return NextResponse.json({ error: "Falha ao enviar mensagem através do serviço de correio. Tente novamente mais tarde." }, { status: 500 });
  }
}
