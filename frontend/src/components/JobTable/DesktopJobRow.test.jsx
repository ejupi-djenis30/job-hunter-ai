import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DesktopJobRow } from './DesktopJobRow';

// Mock clipboard
const mockWriteText = vi.fn();
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText,
    },
});

describe('DesktopJobRow', () => {
    const mockJob = {
        id: '1',
        title: 'Senior Developer',
        company: 'Tech Corp',
        location: 'Zürich',
        created_at: new Date().toISOString(),
        external_url: 'https://example.com/job',
        application_email: 'jobs@techcorp.com',
        affinity_score: 85,
        affinity_analysis: 'Great match for your Python skills.',
        applied: false
    };

    const defaultProps = {
        job: mockJob,
        isGlobalView: false,
        onToggleApplied: vi.fn(),
        onCopy: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders basic job information', () => {
        render(
            <table>
                <tbody>
                    <DesktopJobRow {...defaultProps} />
                </tbody>
            </table>
        );
        expect(screen.getByText('Senior Developer')).toBeInTheDocument();
        expect(screen.getByText('Tech Corp')).toBeInTheDocument();
        expect(screen.getByText(/Zürich/)).toBeInTheDocument();
    });

    it('shows email copy button when application_email is present', () => {
        render(
            <table>
                <tbody>
                    <DesktopJobRow {...defaultProps} />
                </tbody>
            </table>
        );
        const emailBtn = screen.getByTitle(/Copy Email/);
        expect(emailBtn).toBeInTheDocument();
        expect(emailBtn.querySelector('.bi-envelope')).toBeInTheDocument();
    });

    it('hides email copy button when application_email is missing', () => {
        const jobNoEmail = { ...mockJob, application_email: null };
        render(
            <table>
                <tbody>
                    <DesktopJobRow {...defaultProps} job={jobNoEmail} />
                </tbody>
            </table>
        );
        expect(screen.queryByTitle(/Copy Email/)).not.toBeInTheDocument();
    });

    it('copies email to clipboard when email button is clicked', () => {
        render(
            <table>
                <tbody>
                    <DesktopJobRow {...defaultProps} />
                </tbody>
            </table>
        );
        const emailBtn = screen.getByTitle(/Copy Email/);
        fireEvent.click(emailBtn);
        expect(mockWriteText).toHaveBeenCalledWith('jobs@techcorp.com');
    });

    it('toggles affinity analysis visibility', () => {
        render(
            <table>
                <tbody>
                    <DesktopJobRow {...defaultProps} />
                </tbody>
            </table>
        );
        
        // Initial state: Analysis not visible
        expect(screen.queryByText('Great match for your Python skills.')).not.toBeInTheDocument();
        
        const toggleBtn = screen.getByText(/View Analysis/);
        fireEvent.click(toggleBtn);
        
        // After click: Analysis visible
        expect(screen.getByText('Great match for your Python skills.')).toBeInTheDocument();
        expect(screen.getByText(/Hide Analysis/)).toBeInTheDocument();
        
        fireEvent.click(screen.getByText(/Hide Analysis/));
        
        // After second click: Analysis hidden again
        expect(screen.queryByText('Great match for your Python skills.')).not.toBeInTheDocument();
    });
});
