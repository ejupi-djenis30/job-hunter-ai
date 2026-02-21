import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { JobTable } from './JobTable';

// Mock matchMedia for window size
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

describe('JobTable', () => {
    it('renders the empty state when no jobs are provided', () => {
        render(<JobTable jobs={[]} isGlobalView={false} onToggleApplied={vi.fn()} pagination={{}} onPageChange={vi.fn()} />);
        
        expect(screen.getByText("No jobs found")).toBeInTheDocument();
        expect(screen.getByText("Try adjusting your filters or starting a new search to find opportunities.")).toBeInTheDocument();
    });

    it('renders desktop table headers when rendered with jobs', () => {
        const mockJobs = [{
            id: '1', title: 'Software Engineer', company: 'Google', location: 'Zurich', 
            affinity_score: 90, match_reason: 'Good match', is_applied: false
        }];

        const mockPagination = {
            page: 1,
            pages: 1,
            total: 1
        };

        render(<JobTable jobs={mockJobs} isGlobalView={false} onToggleApplied={vi.fn()} pagination={mockPagination} onPageChange={vi.fn()} />);

        expect(screen.getByText('Job Title')).toBeInTheDocument();
        expect(screen.getByText('Company & Location')).toBeInTheDocument();
        expect(screen.getByText('Match & Details')).toBeInTheDocument();
        expect(screen.getByText('Applied')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders pagination links when pagination prop is present', () => {
        const mockJobs = [{ id: '1', title: 'Job 1', company: 'C1' }];
        const mockPagination = {
            page: 2,
            pages: 5,
            total: 50
        };

        render(<JobTable jobs={mockJobs} isGlobalView={false} onToggleApplied={vi.fn()} pagination={mockPagination} onPageChange={vi.fn()} />);

        expect(screen.getByText('2')).toBeInTheDocument();
        // Match the string fragments regardless of exact spacing
        expect(screen.getByText((content, element) => content.includes('/'))).toBeInTheDocument();
        expect(screen.getByText((content, element) => content.includes('Showing'))).toBeInTheDocument();
        expect(screen.getByText('21-40')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();
    });
});
