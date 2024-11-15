# FlashCardGPT
FlashCardGPT transforms study materials into instant flashcards, saving students and professionals countless hours of manual work. While traditional flashcard creation is time-consuming, this app generates high-quality study materials in seconds, leading to better learning outcomes. Think of it as Grammarly for studying - simple, effective, and solving a universal pain point in education.

Built with Next.js and powered by GPT-4o, this open-source template provides developers like you with a foundation to create your own AI-powered learning tools. With AI education tools trending, this template will help you build your next (pun intended) flashcard generator app in no time.

## Live Demo

[https://flash-card-gpt-metaschool.vercel.app/](https://flash-card-gpt-metaschool.vercel.app/)

## Features
- Secure login with Gmail or email/password.
- Easily upload documents to generate flashcards.
- Each flashcard includes AI-curated questions and answers.
- Tailor flashcards to your specific study needs."

## Technologies Used
- Next.js and React for Frontend and Backend
- OpenAI API Key for AI-Powered Features
- Clerk authentication for Authorization

## Use Cases
- Create flashcards from textbooks, notes, and online resources to review key concepts.
- Prepare for exams or interviews with AI-curated questions and answers.
- Utilize flashcards for language learning, professional certifications, or academic topics.

## Installation Steps

1. Clone the repository:
    ```bash
    git clone https://github.com/0xmetaschool/FlashCardGPT.git
    ```

2. Navigate to the project directory:
    ```bash
    cd FlashCardGPT 
    ```

3. Install dependencies:
    ```bash
    npm install
    ```

4. Set up environment variables:
   Create a .env file in the root directory as `.env.local` with the following environment variables:

    ```bash
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
    CLERK_SECRET_KEY=

    NEXT_PUBLIC_CLERK_SIGN_IN_URL=
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=

    OPENAI_API_KEY=
    ```
   
5. Run the development server:
    ```bash
    npm run dev
    ```

6. Open your browser and navigate to `http://localhost:3000`

## Screenshots

<div style="display: flex; justify-content: space-between;">
  <img src="https://github.com/0xmetaschool/FlashCardGPT/blob/main/public/flashcard-gpt-template-landing-page.png?raw=true" alt="FlashCard GPT Template Landing Page screenshot" style="width: 49%; border: 2px solid black;" />
  <img src="https://github.com/0xmetaschool/FlashCardGPT/blob/main/public/flashcard-gpt-template-upload-page.png?raw=true" alt="FlashCard GPT Template Upload Page screenshot" style="width: 49%; border: 2px solid black;" />
</div>
<div style="display: flex; justify-content: space-between;">
  <img src="https://github.com/0xmetaschool/FlashCardGPT/blob/main/public/flashcard-gpt-template-flashcard-page.png?raw=true" alt="FlashCard GPT Template Flashcard Page screenshot" style="width: 49%; border: 2px solid black;" />
</div>


## How to use the application

1. Sign in using your Google account.
2. Upload a document to generate flashcards.
3. Click on any flashcard to view the answer.
4. Review flashcards through the dashboard, and reuse them as needed.


## Contributing

We love contributions! Here's how you can help make the AI-powered FinanceGuru even better:

1. Fork the project (`gh repo fork https://github.com/0xmetaschool/FlashCardGPT.git`)
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE file](https://github.com/0xmetaschool/FlashCardGPT/blob/main/LICENSE) for details.


## Contact
Please open an issue in the GitHub repository for any queries or support.
