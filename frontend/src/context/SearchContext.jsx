/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SearchService } from '../services/search';
import { useAuth } from './AuthContext';

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
    const { isLoggedIn } = useAuth();
    const [searchStatuses, setSearchStatuses] = useState({});
    const [activeProfileIds, setActiveProfileIds] = useState([]);

    useEffect(() => {
        if (!isLoggedIn) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSearchStatuses({});
            setActiveProfileIds([]);
            return;
        }

        const pollStatuses = async () => {
            try {
                const res = await SearchService.getAllStatuses();
                setSearchStatuses(res);
            } catch (e) {
                console.error("Failed to poll statuses:", e);
            }
        };

        pollStatuses();
        const interval = setInterval(pollStatuses, 1500);
        return () => clearInterval(interval);
    }, [isLoggedIn]);

    const addProfileId = (pid) => {
        setActiveProfileIds(prev => {
            const pidStr = String(pid);
            if (prev.includes(pidStr)) return prev;
            return [...prev, pidStr];
        });
    };

    const removeProfileId = (pid) => {
        setActiveProfileIds(prev => prev.filter(id => id !== String(pid)));
    };

    return (
        <SearchContext.Provider value={{
            searchStatuses,
            activeProfileIds,
            addProfileId,
            removeProfileId
        }}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearchContext() {
    const context = useContext(SearchContext);
    if (!context) throw new Error('useSearchContext must be used within SearchProvider');
    return context;
}
