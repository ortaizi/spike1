'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';
import { Loader2, CheckCircle, AlertCircle, Zap, Shield, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  AUTH_ERRORS_HE, 
  AUTH_SUCCESS_HE, 
  PROGRESS_MESSAGES_HE, 
  FLOW_MESSAGES_HE,
  getHebrewErrorMessage 
} from '../../lib/auth/hebrew-auth-errors';

interface SmartAuthCardProps {
  flow: 'new_user' | 'existing_user_auto' | 'existing_user_manual' | 'existing_user_revalidate';
  status: 'idle' | 'loading' | 'success' | 'error';
  isConnecting?: boolean;
  error?: string;
  onRetry?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function SmartAuthCard({
  flow,
  status,
  isConnecting = false,
  error,
  onRetry,
  className,
  children
}: SmartAuthCardProps) {
  const flowConfig = FLOW_MESSAGES_HE[flow];
  
  const getStatusIcon = () => {
    if (isConnecting || status === 'loading') {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    }
    
    switch (flow) {
      case 'existing_user_auto':
        return <Zap className="h-5 w-5 text-green-600" />;
      case 'existing_user_manual':
      case 'existing_user_revalidate':
        return <User className="h-5 w-5 text-orange-600" />;
      default:
        return <Shield className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    if (status === 'error') return 'border-red-200 bg-red-50';
    if (status === 'success') return 'border-green-200 bg-green-50';
    if (isConnecting || status === 'loading') return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-white';
  };

  const getProgressMessage = () => {
    if (!isConnecting && status !== 'loading') return null;
    
    switch (flow) {
      case 'existing_user_auto':
        return PROGRESS_MESSAGES_HE.AutoConnecting;
      case 'existing_user_manual':
      case 'existing_user_revalidate':
        return PROGRESS_MESSAGES_HE.Validating;
      default:
        return PROGRESS_MESSAGES_HE.Connecting;
    }
  };

  return (
    <Card className={cn('w-full transition-all duration-200', getStatusColor(), className)} dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-right">
          {getStatusIcon()}
          <span>{flowConfig.title}</span>
          {status === 'success' && (
            <CheckCircle className="h-5 w-5 text-green-600 me-auto" />
          )}
        </CardTitle>
        <CardDescription className="text-right">
          {flowConfig.subtitle}
        </CardDescription>
        {flowConfig.description && (
          <p className="text-sm text-gray-600 text-right mt-1">
            {flowConfig.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Loading State */}
        {(isConnecting || status === 'loading') && (
          <div className="flex items-center justify-center p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-blue-800 font-medium">
                {getProgressMessage()}
              </span>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && !isConnecting && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-right">
              {flow === 'existing_user_auto' 
                ? AUTH_SUCCESS_HE.AutoAuthSuccess
                : flow === 'new_user'
                ? AUTH_SUCCESS_HE.NewUserSuccess
                : AUTH_SUCCESS_HE.ValidationSuccess
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {status === 'error' && error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-right space-y-2">
              <div>{error}</div>
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry}
                  className="mt-2"
                >
                  נסה שוב
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {children}
      </CardContent>
    </Card>
  );
}

// Specialized components for different authentication flows
export function NewUserAuthCard({ status, isConnecting, error, onRetry, children, className }: 
  Omit<SmartAuthCardProps, 'flow'>) {
  return (
    <SmartAuthCard 
      flow="new_user" 
      status={status}
      isConnecting={isConnecting}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {children}
    </SmartAuthCard>
  );
}

export function AutoAuthCard({ status, isConnecting, error, onRetry, children, className }: 
  Omit<SmartAuthCardProps, 'flow'>) {
  return (
    <SmartAuthCard 
      flow="existing_user_auto" 
      status={status}
      isConnecting={isConnecting}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {children}
    </SmartAuthCard>
  );
}

export function ManualAuthCard({ status, isConnecting, error, onRetry, children, className }: 
  Omit<SmartAuthCardProps, 'flow'>) {
  return (
    <SmartAuthCard 
      flow="existing_user_manual" 
      status={status}
      isConnecting={isConnecting}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {children}
    </SmartAuthCard>
  );
}

export function RevalidationAuthCard({ status, isConnecting, error, onRetry, children, className }: 
  Omit<SmartAuthCardProps, 'flow'>) {
  return (
    <SmartAuthCard 
      flow="existing_user_revalidate" 
      status={status}
      isConnecting={isConnecting}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {children}
    </SmartAuthCard>
  );
}

// RTL-aware status indicator component
export function RTLStatusIndicator({ 
  status, 
  message, 
  className 
}: {
  status: 'loading' | 'success' | 'error' | 'idle';
  message: string;
  className?: string;
}) {
  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm', getColor(), className)} dir="rtl">
      {getIcon()}
      <span className="text-right">{message}</span>
    </div>
  );
}

// Hebrew-aware progress stepper for onboarding
export function HebrewProgressStepper({
  steps,
  currentStep,
  className
}: {
  steps: string[];
  currentStep: number;
  className?: string;
}) {
  return (
    <div className={cn('w-full', className)} dir="rtl">
      <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
        <span>שלב {currentStep + 1} מתוך {steps.length}</span>
        <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      <div className="mt-2 text-center">
        <span className="text-sm text-gray-700">{steps[currentStep]}</span>
      </div>
    </div>
  );
}