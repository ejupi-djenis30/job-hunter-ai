import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MobileJobCard } from './MobileJobCard';

describe('MobileJobCard', () => {
    const mockJob = {
        id: 1,
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'Zürich',
        distance_km: 10,
        affinity_score: 85,
        worth_applying: true,
        workload: 100,
        applied: false,
        created_at: '2024-02-21T10:00:00Z',
        application_url: 'http://apply.com',
        external_url: 'http://source.com',
        application_email: 'jobs@techcorp.com'
    };

    const mockHandlers = {
        onToggleApplied: vi.fn(),
        onCopy: vi.fn()
    };

    it('renders basic job info', () => {
        render(<MobileJobCard job={mockJob} {...mockHandlers} />);
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Tech Corp')).toBeInTheDocument();
        expect(screen.getByText('Zürich')).toBeInTheDocument();
        expect(screen.getByText('10km')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('renders ScoreBadge when not in global view', () => {
        render(<MobileJobCard job={mockJob} isGlobalView={false} {...mockHandlers} />);
        expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('does not render ScoreBadge in global view', () => {
        render(<MobileJobCard job={mockJob} isGlobalView={true} {...mockHandlers} />);
        expect(screen.queryByText('85%')).not.toBeInTheDocument();
    });

    it('renders Top Pick badge when worth applying', () => {
        render(<MobileJobCard job={mockJob} isGlobalView={false} {...mockHandlers} />);
        expect(screen.getByTitle('Top Pick')).toBeInTheDocument();
    });

    it('calls onToggleApplied when checkbox clicked', () => {
        render(<MobileJobCard job={mockJob} {...mockHandlers} />);
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        expect(mockHandlers.onToggleApplied).toHaveBeenCalledWith(mockJob);
    });

    it('calls onCopy when copy button clicked', () => {
        render(<MobileJobCard job={mockJob} {...mockHandlers} />);
        const copyBtn = screen.getByTitle('Copy Info');
        fireEvent.click(copyBtn);
        expect(mockHandlers.onCopy).toHaveBeenCalledWith(mockJob);
    });

    it('renders Apply link with correct href', () => {
        render(<MobileJobCard job={mockJob} {...mockHandlers} />);
        const applyLink = screen.getByText('Apply');
        expect(applyLink).toHaveAttribute('href', mockJob.application_url);
    });

    it('uses external_url if application_url is missing', () => {
        const jobNoApply = { ...mockJob, application_url: null };
        render(<MobileJobCard job={jobNoApply} {...mockHandlers} />);
        const applyLink = screen.getByText('Apply');
        expect(applyLink).toHaveAttribute('href', mockJob.external_url);
    });

    it('renders email link when application_email is present', () => {
        render(<MobileJobCard job={mockJob} {...mockHandlers} />);
        const emailLink = screen.getByTitle('Email');
        expect(emailLink).toHaveAttribute('href', `mailto:${mockJob.application_email}`);
    });
});
