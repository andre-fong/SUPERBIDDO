export default function generateEmailTemplate(username: string, auctionText: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
        * {
            font-family: 'Arial', sans-serif, 'Motiva Sans';
        }
        .email-container {
            background-color: #f0f0f0; 
            text-align: center;
            padding-top: 5px;
        }
        .email-header {
            background-color: #ffffff;
            padding: 10px;
            text-align: center;
            border-radius: 10px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.8); /* Updated shadow to be black */
            width: fit-content;
            margin: 0 auto;
            margin-top: 10px;
        }
        .email-content {
            background-color: #f0f0f0; 
            font-weight: 600;
            font-size: large;
            padding: 20px;
            margin: 0 auto;
            width: fit-content;
        }
        #username-text {
            margin-top: 10px;
            font-weight: 600;
            background-color: #f0f0f0; 
            margin-bottom: 0;
        }

        #auction-text {
            font-weight: 600;
            background-color: #f0f0f0; 
            margin: 0;
        }

        .email-footer {
            background-color: #f0f0f0;
            font-weight: 600;
            padding: 10px;
            margin: 0 auto;
            width: fit-content;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <header class="email-header">
            <img src="cid:logo" alt="Superbiddo Logo" style="width: 200px; height: auto; margin-top: 10px">
        </header>
        <main class="email-content">
            <p id="username-text">Dear ${username},</p>
            <p id="auction-text">${auctionText}</p>
        </main>
        <footer class="email-footer">
            <p style="margin-top: 0; margin-bottom: 0">&copy; 2024 Superbiddo. All rights reserved.</p>
        </footer>
    </div>
</body>
</html>
    `;
}