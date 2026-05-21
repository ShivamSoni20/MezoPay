"use client";
import React, { ReactNode } from 'react';
import { XmtpProvider } from './XmtpContext';

export const XmtpProviderWrapper = ({ children }: { children: ReactNode }) => {
  return <XmtpProvider>{children}</XmtpProvider>;
};
