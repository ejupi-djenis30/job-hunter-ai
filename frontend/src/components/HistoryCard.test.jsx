import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HistoryCard } from './HistoryCard';

const mockProfile = {
    id: 1,
    role_description: 'Software Engineer',
    location_filter: 'Remote',
    posted_within_days: 7,
    schedule_enabled: true,
    schedule_interval_hours: 24
};

describe('HistoryCard', () => {
    it('renders profile details correctly', () => {
        render(<HistoryCard profile={mockProfile} />);
        
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Remote')).toBeInTheDocument();
        expect(screen.getByText('Last 7 days')).toBeInTheDocument();
        expect(screen.getByText('Auto-runs every 24h')).toBeInTheDocument();
    });

    it('renders default location text when location is missing', () => {
        const profileWithoutLocation = { ...mockProfile, location_filter: '' };
        render(<HistoryCard profile={profileWithoutLocation} />);
        
        expect(screen.getByText('Any Location')).toBeInTheDocument();
    });

    it('does not display schedule info if schedule is disabled', () => {
        const profileUnscheduled = { ...mockProfile, schedule_enabled: false };
        render(<HistoryCard profile={profileUnscheduled} />);
        
        expect(screen.queryByText(/Auto-runs every/)).not.toBeInTheDocument();
    });

    it('calls onStartSearch when Run button is clicked', () => {
        const onStartSearch = vi.fn();
        render(<HistoryCard profile={mockProfile} onStartSearch={onStartSearch} />);
        
        const runButton = screen.getByTitle('Rerun Search');
        fireEvent.click(runButton);
        
        expect(onStartSearch).toHaveBeenCalledWith(mockProfile);
    });

    it('calls onEdit when Edit button is clicked', () => {
        const onEdit = vi.fn();
        render(<HistoryCard profile={mockProfile} onEdit={onEdit} />);
        
        const editButton = screen.getByTitle('Edit Parameters');
        fireEvent.click(editButton);
        
        expect(onEdit).toHaveBeenCalledWith(mockProfile);
    });

    it('calls onDelete when Delete button is clicked', () => {
        const onDelete = vi.fn();
        render(<HistoryCard profile={mockProfile} onDelete={onDelete} />);
        
        const deleteButton = screen.getByTitle('Delete');
        fireEvent.click(deleteButton);
        
        expect(onDelete).toHaveBeenCalledWith(mockProfile.id);
    });

    it('shows Add to Schedule button only if schedule is disabled', () => {
        const onSaveAsSchedule = vi.fn();

        // Enabled schedule shouldn't show the button
        const { rerender } = render(<HistoryCard profile={mockProfile} onSaveAsSchedule={onSaveAsSchedule} />);
        expect(screen.queryByTitle('Add to Schedule')).not.toBeInTheDocument();

        // Disabled schedule should show the button
        const profileUnscheduled = { ...mockProfile, schedule_enabled: false };
        rerender(<HistoryCard profile={profileUnscheduled} onSaveAsSchedule={onSaveAsSchedule} />);
        
        const scheduleButton = screen.getByTitle('Add to Schedule');
        expect(scheduleButton).toBeInTheDocument();
        
        fireEvent.click(scheduleButton);
        expect(onSaveAsSchedule).toHaveBeenCalledWith(profileUnscheduled);
    });
});
