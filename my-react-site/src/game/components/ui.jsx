import React from 'react';

import { safeAreaBottom } from '../hooks/responsive';

export const Panel = ({ title, children, actions, style }) => (
    <div style={{
        background: 'linear-gradient(135deg, rgba(30,25,20,0.95) 0%, rgba(20,15,12,0.98) 100%)',
        border: '2px solid #4a3c2a',
        borderRadius: 8,
        padding: 20,
        marginBottom: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        ...style
    }}>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: title ? 16 : 0,
            paddingBottom: title ? 12 : 0,
            borderBottom: title ? '1px solid rgba(201,162,39,0.2)' : 'none'
        }}>
            {title && (
                <h3 style={{
                    margin: 0,
                    fontSize: 18,
                    color: '#c9a227',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    fontWeight: 600
                }}>
                    {title}
                </h3>
            )}
            {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
        </div>
        {children}
    </div>
);

export const Button = ({ children, onClick, variant = 'primary', disabled, style }) => {
    const variants = {
        primary: {
            background: disabled
                ? 'rgba(60,60,60,0.5)'
                : 'linear-gradient(180deg, rgba(201,162,39,0.9), rgba(139,115,25,0.9))',
            color: disabled ? '#666' : '#fff',
            border: `2px solid ${disabled ? '#444' : '#c9a227'}`,
        },
        secondary: {
            background: 'rgba(40,35,30,0.8)',
            color: '#c9a227',
            border: '2px solid #5a4c3a',
        },
        danger: {
            background: 'linear-gradient(180deg, rgba(180,50,50,0.9), rgba(120,30,30,0.9))',
            color: '#fff',
            border: '2px solid #a03030',
        }
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '8px 16px',
                ...variants[variant],
                borderRadius: 4,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: disabled ? 'none' : '0 2px 6px rgba(0,0,0,0.4)',
                textShadow: disabled ? 'none' : '1px 1px 2px rgba(0,0,0,0.6)',
                ...style
            }}
        >
            {children}
        </button>
    );
};

export const MobileActionSheet = ({ open, title, subtitle, actions = [], onClose }) => {
    if (!open) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.65)',
                zIndex: 2500,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                padding: 12,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: 520,
                    background: 'linear-gradient(180deg, rgba(35,28,20,0.98), rgba(20,14,10,0.98))',
                    border: '1px solid #4a3c2a',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                    paddingBottom: safeAreaBottom(),
                }}
            >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: '#ffd700',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {title}
                            </div>
                            {subtitle ? (
                                <div style={{ marginTop: 4, fontSize: 11, color: '#aaa', lineHeight: 1.4 }}>
                                    {subtitle}
                                </div>
                            ) : null}
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#aaa',
                                fontSize: 18,
                                padding: 8,
                                cursor: 'pointer'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div style={{ padding: 12, display: 'grid', gap: 10 }}>
                    {actions.filter(Boolean).map((a, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                if (a.disabled) return;
                                a.onClick?.();
                            }}
                            disabled={a.disabled}
                            style={{
                                padding: '12px 14px',
                                borderRadius: 10,
                                border: `1px solid ${
                                    a.variant === 'danger'
                                        ? 'rgba(244,67,54,0.6)'
                                        : 'rgba(201,162,39,0.35)'
                                }`,
                                background: a.disabled
                                    ? 'rgba(80,80,80,0.25)'
                                    : (a.variant === 'danger'
                                        ? 'rgba(244,67,54,0.18)'
                                        : 'rgba(201,162,39,0.10)'),
                                color: a.disabled
                                    ? '#666'
                                    : (a.variant === 'danger' ? '#ff6b6b' : '#ffd700'),
                                textAlign: 'left',
                                fontFamily: 'inherit',
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: a.disabled ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                                <span>{a.label}</span>
                                {a.hint ? (
                                    <span style={{ fontSize: 11, color: '#aaa', fontWeight: 500 }}>
                                        {a.hint}
                                    </span>
                                ) : null}
                            </div>
                            {a.desc ? (
                                <div style={{ marginTop: 6, fontSize: 11, color: '#aaa', fontWeight: 500, lineHeight: 1.4 }}>
                                    {a.desc}
                                </div>
                            ) : null}
                        </button>
                    ))}
                </div>

                <div style={{ padding: 12 }}>
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(0,0,0,0.25)',
                            color: '#ddd',
                            fontFamily: 'inherit',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    );
};

export const StatBar = ({ label, current, max, color = '#4CAF50' }) => (
    <div style={{ marginBottom: 8 }}>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#aaa',
            marginBottom: 4
        }}>
            <span>{label}</span>
            <span>{Math.floor(current)} / {Math.floor(max)}</span>
        </div>
        <div style={{
            height: 8,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <div style={{
                height: '100%',
                width: `${Math.min(100, (current / max) * 100)}%`,
                background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                transition: 'width 0.3s',
                boxShadow: `0 0 8px ${color}88`
            }} />
        </div>
    </div>
);
