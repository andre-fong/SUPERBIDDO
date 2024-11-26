export default function generateEmailTemplate(username: string, auctionText: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        * {
            font-family: 'Inter', 'Inter Fallback';
        }
        .email-header {
            background-color: #e0e0e0;
            padding: 10px;
            text-align: center;
            border-radius: 10px;
        }
        .email-content {
            background-color: #fbfbfb; 
            font-weight: 600;
            font-size: large;
        }
        #username-text {
            margin-top: 10px;
            font-weight: 600;
        }

        #auction-text {
            font-weight: 600;
        }

        .email-footer {
            background-color: #fbfbfb;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <header class="email-header">
            <img src="https://drive.google.com/uc?export=view&id=1eK9lgwF3Fedd25bphdVwQN1fBgK7Eu-e" alt="Superbiddo Logo" style="width: 200px; height: auto;">
        </header>
        <main class="email-content">
            <p id="username-text">Dear ${username},</p>
            <p id="auction-text">${auctionText}</p>
        </main>
        <footer class="email-footer">
            <p style="margin-top: 0;">&copy; 2024 Superbiddo. All rights reserved.</p>
        </footer>
    </div>
</body>
</html>
    `;
}