// ═══════════════════════════════════════════════════════════════════
// REDESIGNED SCREEN COMPONENTS
// High-impact UI improvements using design system tokens
// ═══════════════════════════════════════════════════════════════════

import { colors, spacing, typography, styles, radius, getOptionStyle, getTextColor, getLevelColor } from './designSystem.js';

// ───────────────────────────────────────────────────────────────────
// 1. QUIZ STAGE — IMPROVED COMPONENTS
// ───────────────────────────────────────────────────────────────────

export function QuizHeader({ level, questionIndex, totalQuestions, timeRemaining, levelColor }) {
  var timerColor = timeRemaining > 60 ? colors.success : timeRemaining > 30 ? colors.warning : colors.error;
  var minutes = Math.floor(timeRemaining / 60);
  var seconds = timeRemaining % 60;
  var timeDisplay = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md + ' ' + spacing.lg,
      background: colors.bgSecondary,
      borderBottom: '2px solid ' + levelColor,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
        <span style={{
          fontSize: typography.label.fontSize,
          fontWeight: 700,
          color: levelColor,
          background: 'rgba(0,0,0,0.3)',
          padding: '4px 8px',
          borderRadius: radius.sm,
        }}>
          {level}
        </span>
        <span style={{
          fontSize: typography.bodySmall.fontSize,
          fontWeight: 600,
          color: colors.textSecondary,
        }}>
          Question {questionIndex + 1} of {totalQuestions}
        </span>
      </div>

      <div style={{
        fontSize: typography.h3.fontSize,
        fontWeight: 900,
        color: timerColor,
      }}>
        {timeDisplay}
      </div>
    </div>
  );
}

export function QuizQuestion({ question, selected, confirmed, onSelect, onSubmit, levelColor }) {
  var q = question;

  return (
    <div style={{ padding: spacing.xl, maxWidth: '700px', margin: '0 auto' }}>
      {/* Question Text */}
      <h2 style={{
        fontSize: typography.h3.fontSize,
        fontWeight: typography.h3.fontWeight,
        color: levelColor,
        marginBottom: spacing.xl,
        lineHeight: 1.4,
      }}>
        {q.q || q.instruction || 'Answer the question'}
      </h2>

      {/* Options Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, marginBottom: spacing.xl }}>
        {q.options && q.options.map(function(opt, i) {
          var isSelected = i === selected;
          var isCorrect = i === q.answer;

          return (
            <button
              key={i}
              onClick={function() { if (!confirmed) onSelect(i); }}
              style={{
                ...getOptionStyle(isSelected, isCorrect, confirmed),
                height: '48px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md + ' ' + spacing.lg,
                fontSize: typography.button.fontSize,
                cursor: confirmed ? 'default' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 150ms ease-in-out',
                borderRadius: radius.lg,
              }}
              disabled={confirmed}
            >
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                fontSize: typography.label.fontSize,
                fontWeight: 900,
                flexShrink: 0,
              }}>
                {confirmed && isCorrect ? '✓' : confirmed && isSelected && !isCorrect ? '✕' : ['A', 'B', 'C', 'D'][i]}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={selected === null}
        style={{
          width: '100%',
          height: '48px',
          background: selected !== null ? levelColor : colors.textMuted,
          color: colors.bg,
          border: 'none',
          borderRadius: radius.lg,
          fontSize: typography.button.fontSize,
          fontWeight: 700,
          cursor: selected !== null ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          transition: 'all 150ms ease-in-out',
          opacity: selected !== null ? 1 : 0.6,
        }}
      >
        {confirmed ? 'Next Question' : 'Check Answer'}
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// 2. RESULTS SCREEN — IMPROVED COMPONENTS
// ───────────────────────────────────────────────────────────────────

export function ResultsScore({ percentage, level }) {
  var scoreColor = getTextColor(percentage);
  var message = percentage >= 80 ? 'Excellent! Master level.' : percentage >= 60 ? 'Great job! Keep improving.' : 'Good effort! Practice more.';

  return (
    <div style={{
      textAlign: 'center',
      padding: spacing.xl,
      marginBottom: spacing.xl,
    }}>
      <div style={{
        fontSize: '88px',
        fontWeight: 900,
        color: scoreColor,
        lineHeight: 1,
        marginBottom: spacing.md,
        animation: 'scaleIn 0.6s ease-out',
      }}>
        {percentage}%
      </div>

      <p style={{
        fontSize: typography.h3.fontSize,
        fontWeight: 700,
        color: scoreColor,
        marginBottom: spacing.sm,
      }}>
        {message}
      </p>

      <p style={{
        fontSize: typography.body.fontSize,
        color: colors.textSecondary,
      }}>
        Level {level} · {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}

export function ResultsBreakdown({ basePoints, timeBonus, streakBonus, totalXp, level }) {
  var stats = [
    { value: basePoints, label: 'Base', color: colors.warning },
    { value: timeBonus, label: 'Time', color: colors.success, prefix: '+' },
    { value: streakBonus, label: 'Streak', color: colors.success, prefix: '+' },
    { value: totalXp, label: 'Total', color: colors.primary },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: spacing.md,
      marginBottom: spacing.xl,
      padding: '0 ' + spacing.xl,
    }}>
      {stats.map(function(stat, i) {
        return (
          <div
            key={i}
            style={{
              ...styles.card,
              textAlign: 'center',
              padding: spacing.lg,
            }}
          >
            <div style={{
              fontSize: typography.h2.fontSize,
              fontWeight: 900,
              color: stat.color,
              marginBottom: spacing.sm,
            }}>
              {(stat.prefix || '') + stat.value}
            </div>
            <div style={{
              fontSize: typography.caption.fontSize,
              color: colors.textMuted,
              fontWeight: 600,
            }}>
              {stat.label} XP
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ResultsQuestionBreakdown({ questions, userAnswers }) {
  var correct = 0;
  for (var i = 0; i < questions.length; i++) {
    if (userAnswers && userAnswers[i] === questions[i].answer) correct++;
  }

  return (
    <div style={{
      padding: spacing.xl,
      background: colors.surface,
      borderRadius: radius.lg,
      marginBottom: spacing.xl,
    }}>
      <h3 style={{
        fontSize: typography.label.fontSize,
        fontWeight: 700,
        color: colors.textMuted,
        marginBottom: spacing.md,
        textTransform: 'uppercase',
      }}>
        Question Breakdown
      </h3>

      <div style={{
        fontSize: typography.body.fontSize,
        marginBottom: spacing.md,
      }}>
        <span style={{ color: colors.success, fontWeight: 700 }}>✓</span>
        <span style={{ color: colors.text, marginLeft: spacing.sm }}>
          {correct}/{questions.length} Correct
        </span>
      </div>

      {questions.map(function(q, i) {
        var isCorrect = userAnswers && userAnswers[i] === q.answer;
        return (
          <div key={i} style={{
            display: 'flex',
            gap: spacing.sm,
            fontSize: typography.bodySmall.fontSize,
            marginBottom: spacing.sm,
            color: isCorrect ? colors.success : colors.error,
          }}>
            <span style={{ fontWeight: 700, minWidth: '16px' }}>
              {isCorrect ? '✓' : '✕'}
            </span>
            <span>{q.type || 'Question ' + (i + 1)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ResultsActions({ onPlayAgain, onViewLeaderboard, onChallenge }) {
  var actionButtons = [
    { label: 'Play Another Level', onClick: onPlayAgain, primary: true },
    { label: 'View Leaderboard', onClick: onViewLeaderboard, primary: false },
    { label: 'Challenge a Friend', onClick: onChallenge, primary: false },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
      padding: spacing.xl,
    }}>
      {actionButtons.map(function(btn, i) {
        return (
          <button
            key={i}
            onClick={btn.onClick}
            style={{
              padding: space = '12px ' + spacing.lg,
              background: btn.primary ? colors.primary : 'transparent',
              color: btn.primary ? colors.bg : colors.text,
              border: btn.primary ? 'none' : '1px solid ' + colors.border,
              borderRadius: radius.lg,
              fontSize: typography.button.fontSize,
              fontWeight: 700,
              height: '48px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 150ms ease-in-out',
            }}
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// 3. LEADERBOARD — IMPROVED COMPONENTS
// ───────────────────────────────────────────────────────────────────

export function LeaderboardRankBadge({ rank }) {
  var rankColor = rank === 1 ? '#fbbf24' : rank === 2 ? '#d1d5db' : rank === 3 ? '#d97706' : colors.primary;
  var rankEmoji = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: rankColor,
      color: rank <= 3 ? colors.bg : colors.text,
      fontSize: '20px',
      fontWeight: 900,
      flexShrink: 0,
    }}>
      {rankEmoji || rank}
    </div>
  );
}

export function LeaderboardEntry({ rank, user, isCurrentUser, totalXp, avgPercentage }) {
  return (
    <div style={{
      ...styles.card,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      marginBottom: spacing.md,
      background: isCurrentUser ? colors.surfaceHover : colors.surface,
      borderLeft: isCurrentUser ? '4px solid ' + colors.primary : 'none',
      paddingLeft: isCurrentUser ? 'calc(' + spacing.lg + ' - 4px)' : spacing.lg,
    }}>
      <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center', flex: 1 }}>
        <LeaderboardRankBadge rank={rank} />

        <div>
          <div style={{
            fontSize: typography.body.fontSize,
            fontWeight: 700,
            color: colors.text,
            marginBottom: spacing.xs,
          }}>
            {user.name}
            {isCurrentUser && <span style={{ color: colors.primary, marginLeft: spacing.sm }}>You</span>}
          </div>
          <div style={{
            fontSize: typography.caption.fontSize,
            color: colors.textMuted,
          }}>
            {avgPercentage}% • {user.games ? user.games.length : 0} Games
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'right',
      }}>
        <div style={{
          fontSize: typography.h3.fontSize,
          fontWeight: 900,
          color: colors.warning,
        }}>
          {totalXp}
        </div>
        <div style={{
          fontSize: typography.caption.fontSize,
          color: colors.textMuted,
        }}>
          XP
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// 4. PROFILE & FRIENDS — IMPROVED COMPONENTS
// ───────────────────────────────────────────────────────────────────

export function ProfileHeader({ userName, level, joinDate, likes, isCurrentUser, onLike, hasLiked }) {
  return (
    <div style={{
      ...styles.card,
      borderLeft: '4px solid ' + colors.primary,
      paddingLeft: 'calc(' + spacing.lg + ' - 4px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.lg,
    }}>
      <div>
        <h2 style={{
          fontSize: typography.h2.fontSize,
          fontWeight: typography.h2.fontWeight,
          color: colors.text,
          marginBottom: spacing.sm,
        }}>
          {userName}
        </h2>
        <div style={{
          fontSize: typography.bodySmall.fontSize,
          color: colors.textSecondary,
        }}>
          Level {level} • Joined {joinDate}
        </div>
      </div>

      {!isCurrentUser && (
        <button
          onClick={onLike}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            opacity: hasLiked ? 1 : 0.5,
            transform: hasLiked ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 150ms ease-in-out',
          }}
        >
          ♡
        </button>
      )}
    </div>
  );
}

export function ComparisonTable({ rows }) {
  return (
    <div style={{
      ...styles.card,
      marginBottom: spacing.lg,
    }}>
      <h3 style={{
        fontSize: typography.label.fontSize,
        fontWeight: 700,
        color: colors.textMuted,
        marginBottom: spacing.md,
        textTransform: 'uppercase',
      }}>
        Comparison with You
      </h3>

      {rows.map(function(row, i) {
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: spacing.md + ' 0',
              borderBottom: i < rows.length - 1 ? '1px solid ' + colors.border : 'none',
            }}
          >
            <span style={{ color: colors.textSecondary }}>{row.label}</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: colors.text, fontWeight: 700 }}>{row.friend}</span>
              <span style={{ color: colors.textMuted, marginLeft: spacing.md }}>vs {row.you}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProfileActions({ onSendChallenge, onRemoveFriend, onMessage }) {
  var actions = [
    { label: 'Send Challenge', onClick: onSendChallenge, primary: true },
    { label: 'Remove Friend', onClick: onRemoveFriend, primary: false, danger: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {actions.map(function(action, i) {
        return (
          <button
            key={i}
            onClick={action.onClick}
            style={{
              padding: space = '12px ' + spacing.lg,
              background: action.primary ? colors.primary : action.danger ? colors.error : 'transparent',
              color: action.primary || action.danger ? colors.bg : colors.text,
              border: action.primary || action.danger ? 'none' : '1px solid ' + colors.border,
              borderRadius: radius.lg,
              fontSize: typography.button.fontSize,
              fontWeight: 700,
              height: '44px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 150ms ease-in-out',
            }}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
