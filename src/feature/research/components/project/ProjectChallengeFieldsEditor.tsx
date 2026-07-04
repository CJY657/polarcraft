import { cn } from '@/utils/classNames';
import {
  CHALLENGE_DIFFICULTY_OPTIONS,
  type ChallengeDifficulty,
} from './projectChallengeCard';

export interface ProjectChallengeFieldsValue {
  challenge_value_zh: string;
  challenge_objectives_zh: string;
  challenge_beginner_steps_zh: string;
  challenge_min_deliverables_zh: string;
  challenge_review_criteria_zh: string;
  challenge_timeline_zh: string;
  challenge_difficulty: ChallengeDifficulty;
  challenge_roles_zh: string;
  challenge_missing_roles_zh: string;
  challenge_progress_zh: string;
}

interface ProjectChallengeFieldsEditorProps<T extends ProjectChallengeFieldsValue> {
  value: T;
  onChange: (value: T) => void;
  theme: string;
}

const challengeFieldRows: Array<{
  key: keyof Omit<ProjectChallengeFieldsValue, 'challenge_difficulty'>;
  label: string;
  placeholder: string;
  rows: number;
}> = [
  {
    key: 'challenge_value_zh',
    label: '挑战价值',
    placeholder: '说明这个挑战为什么值得做，以及学生能从中学到什么。',
    rows: 3,
  },
  {
    key: 'challenge_objectives_zh',
    label: '挑战目标',
    placeholder: '每行一个目标，例如：建立变量记录表。',
    rows: 3,
  },
  {
    key: 'challenge_beginner_steps_zh',
    label: '入门步骤',
    placeholder: '每行一步，帮助新同学从第一轮观察开始。',
    rows: 3,
  },
  {
    key: 'challenge_min_deliverables_zh',
    label: '最低交付物',
    placeholder: '例如：观察记录、阶段小结、图片或数据。',
    rows: 3,
  },
  {
    key: 'challenge_review_criteria_zh',
    label: '评价标准',
    placeholder: '说明如何判断一次参与是有效的。',
    rows: 3,
  },
  {
    key: 'challenge_timeline_zh',
    label: '时间节奏',
    placeholder: '例如：第 1 周完成观察，第 2 周整理变量。',
    rows: 2,
  },
  {
    key: 'challenge_roles_zh',
    label: '适合角色',
    placeholder: '每行一个角色，例如：观察记录员、数据整理员。',
    rows: 3,
  },
  {
    key: 'challenge_missing_roles_zh',
    label: '当前缺口',
    placeholder: '建议一行一个缺口，例如：缺数据整理 1 人。',
    rows: 3,
  },
  {
    key: 'challenge_progress_zh',
    label: '当前进度',
    placeholder: '例如：已完成第一轮观察，正在补充对照变量。',
    rows: 2,
  },
];

export const emptyProjectChallengeFields: ProjectChallengeFieldsValue = {
  challenge_value_zh: '',
  challenge_objectives_zh: '',
  challenge_beginner_steps_zh: '',
  challenge_min_deliverables_zh: '',
  challenge_review_criteria_zh: '',
  challenge_timeline_zh: '',
  challenge_difficulty: 'beginner',
  challenge_roles_zh: '',
  challenge_missing_roles_zh: '',
  challenge_progress_zh: '',
};

export function ProjectChallengeFieldsEditor<T extends ProjectChallengeFieldsValue>({
  value,
  onChange,
  theme,
}: ProjectChallengeFieldsEditorProps<T>) {
  const labelClassName = cn(
    'block text-base font-medium mb-1.5',
    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
  );
  const inputClassName = cn(
    'w-full px-3 py-2 rounded-lg border transition-colors',
    theme === 'dark'
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
  );

  return (
    <div className="space-y-4 rounded-xl border border-gray-200/70 p-4 dark:border-gray-700/80">
      <div>
        <h3 className={cn('text-lg font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
          学生挑战卡
        </h3>
        <p className={cn('mt-1 text-base', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
          把课题写成学生能直接选择角色、开始行动、交付成果的挑战。
        </p>
      </div>

      <div>
        <label className={labelClassName}>挑战难度</label>
        <select
          value={value.challenge_difficulty}
          onChange={(event) => onChange({ ...value, challenge_difficulty: event.target.value as ChallengeDifficulty })}
          className={inputClassName}
        >
          {CHALLENGE_DIFFICULTY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {challengeFieldRows.map((field) => (
        <div key={field.key}>
          <label className={labelClassName}>{field.label}</label>
          <textarea
            value={value[field.key]}
            onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
            rows={field.rows}
            placeholder={field.placeholder}
            className={cn(inputClassName, 'resize-none')}
          />
        </div>
      ))}
    </div>
  );
}
