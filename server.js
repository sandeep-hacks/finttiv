import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();

// Configure CORS for your Vercel domain
app.use(cors({
    origin: [
        'https://fin-safe-ai.vercel.app',
        'http://localhost:5501',
        'https://finttiv.vercel.app/',
        'http://127.0.0.1:5501'
    ],
    credentials: true
}));

app.use(express.json());

// ====== OpenAI Client Setup ======
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
let openai = null;

console.log('\n🚀 FinSafe AI Vercel Server Starting...');
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`🔐 OpenAI Key configured: ${!!OPENAI_API_KEY}`);

if (OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-')) {
    openai = new OpenAI({
        apiKey: OPENAI_API_KEY
    });
    console.log('✅ OpenAI client created');
} else {
    console.log('⚠️ Using enhanced mock responses');
}

// ====== API ROUTES ======
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        server: 'FinSafe AI',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        openai: openai ? 'configured' : 'mock_mode',
        vercel: true
    });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ 
                reply: 'Please enter a question.',
                mode: 'error'
            });
        }
        
        console.log(`💬 Chat request: "${message.substring(0, 50)}..."`);
        
        // Try OpenAI if available
        if (openai) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: `You are FinSafe AI, a helpful financial advisor for Indian students and young professionals.
                            Provide practical, actionable advice in simple English.
                            Focus on Indian context (use ₹ for currency).
                            Keep responses under 200 words.
                            Include specific examples when helpful.
                            Format with clear paragraphs.
                            Always be encouraging and supportive.
                            Never give financial advice that could be considered legal or investment advice.`
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    max_tokens: 300,
                    temperature: 0.7,
                });
                
                const aiResponse = completion.choices[0].message.content;
                
                return res.json({ 
                    reply: aiResponse,
                    mode: 'ai',
                    model: completion.model,
                    tokens: completion.usage?.total_tokens
                });
                
            } catch (openaiError) {
                console.log('❌ OpenAI error:', openaiError.message);
                // Fall through to mock response
            }
        }
        
        // Enhanced mock response
        const mockResponse = getEnhancedMockResponse(message);
        
        return res.json({ 
            reply: mockResponse,
            mode: 'enhanced_mock',
            note: 'Providing detailed financial guidance from our knowledge base.'
        });
        
    } catch (error) {
        console.error('❌ Server error:', error.message);
        return res.status(500).json({
            reply: getEnhancedMockResponse(req.body?.message || 'Error occurred'),
            mode: 'fallback',
            error: 'Server error occurred'
        });
    }
});

// Enhanced mock responses function
function getEnhancedMockResponse(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('debit') && lowerQuery.includes('card')) {
        return `💳 **Debit Card Basics for Students**\n\nA debit card is directly linked to your bank account. Money is deducted immediately when you use it.\n\n✅ **Advantages:**\n• Safer than carrying cash\n• Helps control spending (can't spend more than you have)\n• Use for online shopping, bill payments\n• Track expenses via bank statements\n\n🔒 **Security Tips:**\n• Never share your PIN with anyone\n• Enable SMS alerts for all transactions\n• Use at trusted ATMs only\n• Report lost cards immediately\n\n📱 **For Students:** Start with a basic savings account with debit card. Most banks offer zero-balance accounts for students.`;
    }
    
    if (lowerQuery.includes('emi') || lowerQuery.includes('loan')) {
        return `📋 **EMI (Equated Monthly Installment) Guide**\n\nEMI is your fixed monthly loan payment that includes both principal and interest.\n\n💡 **Smart EMI Rules for Students:**\n• Keep total EMIs below 30% of your income\n• Example: ₹25,000 monthly income → ₹7,500 max EMI\n• Use online EMI calculators before committing\n• Compare interest rates from different banks\n\n📊 **Example Calculation:**\n• Loan: ₹50,000 at 12% interest for 2 years\n• EMI: ₹2,355 per month\n• Total Interest: ₹6,520\n• Total Payment: ₹56,520\n\n⚠️ **Warning:** Avoid multiple EMIs simultaneously. Always read loan terms carefully.`;
    }
    
    if (lowerQuery.includes('credit card')) {
        return `💳 **Credit Cards: Student Edition**\n\nCredit cards let you borrow money up to a credit limit. Interest rates: 18-42% annually in India.\n\n✅ **When to Use:**\n• Building credit history (important for future loans)\n• Emergency expenses only\n• Online purchases (better security than debit cards)\n• Reward points on spending\n\n❌ **Dangers for Students:**\n• Easy to overspend beyond your means\n• High interest if you don't pay full amount\n• Minimum payment trap (paying just minimum keeps debt growing)\n• Late payment fees and credit score damage\n\n🛡️ **Safety Rules:**\n1. Set a spending limit of 30% of your credit limit\n2. ALWAYS pay full balance by due date\n3. Never use for cash withdrawals (high charges)\n4. Monitor transactions weekly via bank app\n5. Report lost cards immediately\n\n💡 **Student Tip:** Start with a secured credit card or low-limit card (₹10,000-20,000).`;
    }
    
    if (lowerQuery.includes('scam') || lowerQuery.includes('fraud')) {
        return `⚠️ **Common Financial Scams Targeting Students**\n\n1. **Fake Job/Internship Offers:**\n   • "Pay ₹2,000 registration fee for work-from-home job"\n   • "Processing fee for guaranteed placement"\n\n2. **Scholarship Fraud:**\n   • "Pay ₹500 to get ₹50,000 scholarship"\n   • "Exclusive scholarship for limited students"\n\n3. **Bank Phishing:**\n   • "Your account is blocked. Click link to verify"\n   • "Update KYC or account will be suspended"\n\n4. **Investment Scams:**\n   • "Double your money in 30 days"\n   • "Guaranteed returns of 50% monthly"\n\n🛡️ **Protection Guide:**\n• Never share OTP/PIN/CVV with ANYONE\n• Verify offers through official college/bank channels\n• Check sender's number/email carefully\n• Use UPI for payments (more secure)\n• Report scams to cybercrime.gov.in\n\n📞 **Emergency Contacts:**\n• Cyber Crime Helpline: 1930\n• National Cyber Crime Portal: cybercrime.gov.in`;
    }
    
    if (lowerQuery.includes('save') || lowerQuery.includes('budget')) {
        return `💰 **Simple Budgeting for Students (Monthly Guide)**\n\n📊 **50-30-20 Rule:**\n• **50% Needs:** Rent, food, transport, utilities\n• **30% Wants:** Movies, eating out, shopping, hobbies\n• **20% Savings:** Emergency fund, investments, goals\n\n💡 **Practical Student Tips:**\n1. **Track EVERY expense for 1 month** (use Notes app)\n2. **Cook 5 days/week**, eat out 2 days (save ₹3,000-5,000/month)\n3. **Use public transport** instead of cabs (save ₹2,000-4,000/month)\n4. **Share subscriptions** (Netflix, Amazon Prime with friends)\n5. **Buy second-hand textbooks** or use library\n6. **Use student discounts** everywhere (theaters, museums, transport)\n\n🎯 **Sample Student Budget (₹25,000/month):**\n• Rent/Hostel: ₹8,000 (32%)\n• Food: ₹6,000 (24%)\n• Transport: ₹2,000 (8%)\n• Study Material: ₹2,000 (8%)\n• Entertainment: ₹3,000 (12%)\n• **SAVINGS: ₹4,000 (16%)**\n\n💰 **Start with saving just ₹500-1,000/month.** Consistency matters more than amount!`;
    }
    
    if (lowerQuery.includes('investment') || lowerQuery.includes('invest')) {
        return `📈 **First Investments for Students**\n\n**Beginner-Friendly Options (Start with ₹500/month):**\n\n1. **Recurring Deposit (RD):**\n   • Minimum: ₹500/month\n   • Returns: 5-7% annually\n   • Safe, guaranteed returns\n   • Good for short-term goals (1-5 years)\n\n2. **Mutual Fund SIP (Systematic Investment Plan):**\n   • Minimum: ₹500/month\n   • Returns: 10-15% long-term (market-linked)\n   • Choose equity funds for long-term (5+ years)\n   • Use apps like Groww, Zerodha, Kuvera\n\n3. **Public Provident Fund (PPF):**\n   • Minimum: ₹500/year\n   • Returns: 7.1% currently (tax-free)\n   • 15-year lock-in (good for long-term)\n   • Tax benefits under Section 80C\n\n4. **Digital Gold:**\n   • Start with ₹100\n   • Easy via apps like Paytm, Google Pay\n   • Can convert to physical gold\n   • Good for small, regular savings\n\n⚠️ **Important Rules:**\n• Start SMALL (₹500/month)\n• NEVER invest in "get rich quick" schemes\n• Understand what you're investing in\n• Diversify (spread across 2-3 options)\n• Be patient (investments need time to grow)\n\n💡 **Student Strategy:** Start with RD + one SIP. Automate payments so you don't forget.`;
    }
    
    if (lowerQuery.includes('emergency fund')) {
        return `🆘 **Emergency Fund for Students**\n\n**What is it?** Money set aside for unexpected expenses (medical, travel, repairs, etc.).\n\n🎯 **Goal:** 3-6 months of basic expenses\n\n**For Students:**\n• Monthly expenses: ₹15,000\n• Emergency fund target: ₹45,000-₹90,000\n\n💰 **How to Build:**\n1. **Start small:** Save ₹1,000/month\n2. **Use separate account:** Don't mix with regular money\n3. **Automate transfers:** Set auto-debit on salary day\n4. **Windfall money:** Put part of gifts/bonuses into emergency fund\n\n🏦 **Where to Keep:**\n• **Savings account:** Easy access, low interest\n• **Liquid mutual funds:** Better returns, easy withdrawal\n• **Don't use:** Fixed deposits (penalty for early withdrawal)\n\n⚠️ **When to Use:**\n• Medical emergencies\n• Family emergencies\n• Urgent travel\n• Essential repairs\n\n❌ **When NOT to Use:**\n• Shopping sales\n• Weekend trips\n• Gadget upgrades\n• Non-essential purchases`;
    }
    
    // Default response
    return `🤔 I understand you're asking about: "${query}"\n\nI'm FinSafe AI, your financial safety assistant for students and young earners in India. I can help you with:\n\n💳 **Credit/Debit Cards** - Understanding risks and safe usage\n📋 **EMI & Loans** - Smart borrowing strategies\n⚠️ **Scam Prevention** - Protecting yourself from fraud\n💰 **Saving & Budgeting** - Managing your money effectively\n📈 **First Investments** - Starting your investment journey\n🆘 **Emergency Funds** - Preparing for unexpected expenses\n\n💡 **General advice for students:**\n1. Start tracking your expenses today\n2. Save at least 10-20% of any money you receive\n3. Avoid debt unless absolutely necessary for education\n4. Build an emergency fund before investing\n5. Learn about scams - knowledge is your best protection\n\nAsk me anything specific about your financial situation!`;
}

// ====== VERCEL SERVERLESS CONFIGURATION ======
export default app;

// Local development server (only runs when not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5501;
    app.listen(PORT, () => {
        console.log(`\n✅ Server running on port ${PORT}`);
        console.log(`🌐 Local URL: http://localhost:${PORT}`);
        console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
        console.log(`🤖 Chat API: POST http://localhost:${PORT}/api/chat`);
    });
}