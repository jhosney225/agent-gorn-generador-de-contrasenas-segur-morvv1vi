
```javascript
import Anthropic from "@anthropic-ai/sdk";
import * as crypto from "crypto";
import * as readline from "readline";

const client = new Anthropic();

// Función para calcular la entropía de una contraseña
function calculateEntropy(password) {
  // Conjuntos de caracteres posibles
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  let charsetSize = 0;
  if (hasLowercase) charsetSize += 26;
  if (hasUppercase) charsetSize += 26;
  if (hasDigits) charsetSize += 10;
  if (hasSpecial) charsetSize += 32;

  // Entropía = log2(charsetSize^passwordLength)
  const entropy = password.length * Math.log2(charsetSize);
  return {
    entropy: entropy.toFixed(2),
    charsetSize,
    requirements: {
      lowercase: hasLowercase,
      uppercase: hasUppercase,
      digits: hasDigits,
      special: hasSpecial,
    },
  };
}

// Función para generar una contraseña segura
function generatePassword(length = 16) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%^&*()_+-=[]{};\\':\"|,.<>/?";

  const allChars = lowercase + uppercase + digits + special;
  let password = "";

  // Asegurar que haya al menos un carácter de cada tipo
  const minPassword = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  // Llenar el resto de la contraseña aleatoriamente
  for (let i = minPassword.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mezclar los caracteres
  password = minPassword.concat(password.split(""));
  password = password
    .sort(() => Math.random() - 0.5)
    .join("");

  return password.substring(0, length);
}

// Función para crear una interfaz interactiva
async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => {
      rl.question(prompt, resolve);
    });

  console.log("\n🔐 Generador de Contraseñas Seguras con Medidor de Entropía");
  console.log("=".repeat(60));

  const conversationHistory = [];

  // Primer mensaje al usuario
  const initialPrompt = `Eres un asistente experto en seguridad de contraseñas. 
Ayudarás al usuario a:
1. Generar contraseñas seguras aleatorias
2. Analizar la entropía y fortaleza de las contraseñas
3. Proporcionar consejos sobre mejores prácticas de seguridad

Comienza saludando al usuario y oferécele las opciones disponibles.`;

  try {
    const initialResponse = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: initialPrompt,
        },
      ],
    });

    const assistantGreeting =
      initialResponse.content[0].type === "text"
        ? initialResponse.content[0].text
        : "";
    console.log("\n🤖 Asistente:", assistantGreeting);

    conversationHistory.push({
      role: "user",
      content: initialPrompt,
    });
    conversationHistory.push({
      role: "assistant",
      content: assistantGreeting,
    });

    // Loop interactivo
    while (true) {
      const userInput = await question("\n👤 Tú: ");

      if (
        userInput.toLowerCase() === "salir" ||
        userInput.toLowerCase() === "exit"
      ) {
        console.log(
          "\n👋 ¡Gracias por usar el generador de contraseñas seguras!"
        );
        break;
      }

      // Procesar comandos especiales
      let processedInput = userInput;
      if (userInput.toLowerCase().includes("generar")) {
        const lengthMatch = userInput.match(/(\d+)/);
        const length = lengthMatch ? parseInt(lengthMatch[1]) : 16;
        const generatedPassword = generatePassword(length);
        const entropyData = calculateEntropy(generatedPassword);

        processedInput = `${userInput}

Contraseña generada: ${generatedPassword}
Longitud: ${length}
Entropía: ${entropyData.entropy} bits
Conjunto de caracteres: ${entropyData.charsetSize}
Requisitos cumplidos: Minúsculas: ${entropyData.requirements.lowercase}, Mayúsculas: ${entropyData.requirements.uppercase}, Dígitos: ${entropyData.requirements.digits}, Caracteres especiales: ${entropyData.requirements.special}`;
      } else if (userInput.toLowerCase().includes("