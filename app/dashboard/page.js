'use client';
import React, { useState } from 'react';
import { Upload, FileText, Loader, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from "@/components/ui/skeleton";

// Updated Processing Steps Component
const ProcessingSteps = ({ currentStep }) => {
  const steps = [
    { id: 1, title: 'Uploading Document', description: 'Processing your file...' },
    { id: 2, title: 'Analyzing Content', description: 'Extracting key information...' },
    { id: 3, title: 'Generating Flashcards', description: 'Creating study materials...' },
    { id: 4, title: 'Finalizing', description: 'Preparing your flashcards...' }
  ];

  if (currentStep === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm border border-gray-200 animate-slide-up z-50">
      <div className="space-y-3">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`flex items-center gap-3 transition-all duration-300 
              ${currentStep >= step.id ? 'opacity-100' : 'opacity-40'}
              ${currentStep === step.id ? 'scale-105' : 'scale-100'}
              ${currentStep < step.id ? 'translate-y-0' : '-translate-y-0'}`}
          >
            <div className="flex-shrink-0">
              {currentStep > step.id ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 transition-all duration-300" />
              ) : currentStep === step.id ? (
                <Loader className="h-5 w-5 text-blue-500 animate-spin transition-all duration-300" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300 transition-all duration-300" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm truncate">{step.title}</span>
              <span className="text-xs text-gray-500 truncate">{step.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FlashCard = ({ question, answer, index, isLoading }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (!isLoading) {
      setIsFlipped(!isFlipped);
    }
  };

  if (isLoading) {
    return (
      <div className="relative h-48 w-full">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  return (
    <div 
      className="relative h-48 w-full perspective-1000"
      onClick={handleClick}
    >
      <div className={`relative w-full h-full duration-500 preserve-3d cursor-pointer ${
        isFlipped ? 'rotate-y-180' : ''
      }`}>
        {/* Front of card */}
        <div className="absolute w-full h-full backface-hidden">
          <div className="p-6 rounded-lg border bg-card h-full flex flex-col justify-between">
            <div className="overflow-auto">
              <h3 className="font-semibold text-lg mb-2">Question {index + 1}</h3>
              <p className="text-gray-600">{question}</p>
            </div>
            <p className="text-sm text-gray-400 text-center">Click to reveal answer</p>
          </div>
        </div>
        
        {/* Back of card */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className="p-6 rounded-lg border bg-card h-full flex flex-col justify-between">
            <div className="overflow-auto">
              <h3 className="font-semibold text-lg mb-2">Answer</h3>
              <p className="text-gray-600">{answer}</p>
            </div>
            <p className="text-sm text-gray-400 text-center">Click to see question</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCards, setLoadingCards] = useState([]);
  const [processingStep, setProcessingStep] = useState(0);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    const validFileTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!selectedFile) {
      setError('No file selected');
      setFile(null);
      return;
    }

    if (!validFileTypes.includes(selectedFile.type)) {
      setError('Please upload a valid file type (TXT, PDF, DOC, or DOCX)');
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10 MB. Please upload a smaller document.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const generateFlashcards = async () => {
    if (!file) {
      setError('Please upload a file first');
      return;
    }

    setLoading(true);
    setError('');
    setIsSubmitting(true);
    setLoadingCards(Array(4).fill({ isLoading: true }));

    try {
      // Step 1: Uploading
      setProcessingStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Analyzing
      setProcessingStep(2);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Generating
      setProcessingStep(3);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/generate-flashcards', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate flashcards');
      }

      if (!data.flashcards || data.flashcards.length === 0) {
        setError('No flashcards could be generated from the document. Please try a different document.');
        setLoadingCards([]);
        setIsSubmitting(false);
        return;
      }

      if (file.size === 0) {
        setError('The uploaded document is empty. Please upload a document with content.');
        setLoadingCards([]);
        setIsSubmitting(false);
        return;
      }

      // Step 4: Finalizing
      setProcessingStep(4);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate gradual loading of flashcards
      const cards = data.flashcards;
      setFlashcards([]);
      for (let i = 0; i < cards.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setFlashcards(prev => [...prev, cards[i]]);
        setLoadingCards(prev => prev.slice(1));
      }

      if (data.totalChunks > data.processedChunks) {
        setError(`Note: Only processed ${data.processedChunks} of ${data.totalChunks} sections due to size limitations. Consider uploading a smaller document for better results.`);
      }
    } catch (err) {
      let errorMessage = 'Failed to generate flashcards. Please try again.';
      if (err.message.includes('Rate limit exceeded')) {
        errorMessage = 'Please wait a few minutes before trying again, or try with a smaller document.';
      } else if (err.message.includes('too large')) {
        errorMessage = 'Document is too large. Please try with a smaller document (less than 10 pages recommended).';
      }
      setError(errorMessage);
      setLoadingCards([]);
      setIsSubmitting(false);
    } finally {
      setLoading(false);
      // Reset processing step after a delay
      setTimeout(() => setProcessingStep(0), 1000);
    }
  };

  const resetAll = () => {
    setFile(null);
    setFlashcards([]);
    setLoadingCards([]);
    setError('');
    setIsSubmitting(false);
    setProcessingStep(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-3">Study Dashboard</h1>
          <p className="text-gray-600">Transform your documents into interactive flashcards</p>
        </div>
        
        {!isSubmitting ? (
          <div className="flex flex-col items-center justify-center pt-12">
            <Card>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>Upload a Text, PDF or word document to generate flashcards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full">
                    <label 
                      htmlFor="file-upload" 
                      className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Upload className="h-8 w-8 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-500">
                          {file ? file.name : 'Click to upload or drag and drop'}
                        </p>
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  
                  <Button 
                    onClick={generateFlashcards}
                    disabled={!file || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Generating Flashcards...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Flashcards
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={resetAll}
                    className="w-full"
                    variant="secondary"
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-4 text-center">
                <CardTitle>Generated Flashcards</CardTitle>
                <CardDescription>Click on a card to reveal its answer</CardDescription>
              </CardHeader>
            </Card>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {flashcards.map((card, index) => (
                <FlashCard
                  key={`card-${index}`}
                  question={card.question}
                  answer={card.answer}
                  index={index}
                  isLoading={false}
                />
              ))}
              {loadingCards.map((_, index) => (
                <FlashCard
                  key={`loading-${index}`}
                  isLoading={true}
                />
              ))}
            </div>

            <div className="flex justify-center mt-4 mb-4">    
              <Button 
                onClick={resetAll}
                className="align-middle mt-4 mb-4 bg-black text-white"
                variant="primary"
              >
                Submit Another Document
              </Button>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ProcessingSteps currentStep={processingStep} />
      </div>
    </div>
  );
}