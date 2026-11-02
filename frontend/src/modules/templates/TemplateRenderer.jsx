import React from 'react';
import ModernTemplate from './ModernTemplate/ModernTemplate';
import AtsTemplate from './AtsTemplate/AtsTemplate';
import TraditionalTemplate from './TraditionalTemplate/TraditionalTemplate';

export default function TemplateRenderer({ template = 'modern', content = {}, targetRole = '' }) {
  switch (template?.toLowerCase()) {
    case 'ats':
      return <AtsTemplate content={content} targetRole={targetRole} />;
    case 'traditional':
      return <TraditionalTemplate content={content} targetRole={targetRole} />;
    case 'modern':
    default:
      return <ModernTemplate content={content} targetRole={targetRole} />;
  }
}

