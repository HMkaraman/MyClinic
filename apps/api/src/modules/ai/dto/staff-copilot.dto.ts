import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StaffCopilotMessageHistoryItem {
  @ApiProperty({ enum: ['user', 'assistant', 'system'] })
  role!: 'user' | 'assistant' | 'system';

  @ApiProperty()
  content!: string;
}

export class StaffCopilotRequestDto {
  @ApiProperty({ description: 'The staff query or command' })
  @IsString()
  query!: string;

  @ApiPropertyOptional({ description: 'Previous messages in the session', type: [StaffCopilotMessageHistoryItem] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffCopilotMessageHistoryItem)
  messageHistory?: StaffCopilotMessageHistoryItem[];

  @ApiPropertyOptional({ description: 'Context about what the staff is currently viewing' })
  @IsOptional()
  @IsString()
  currentContext?: string;

  @ApiPropertyOptional({ description: 'Current entity type being viewed' })
  @IsOptional()
  @IsString()
  currentEntityType?: string;

  @ApiPropertyOptional({ description: 'Current entity ID being viewed' })
  @IsOptional()
  @IsString()
  currentEntityId?: string;
}

export class ToolExecution {
  @ApiProperty({ description: 'Tool that was executed' })
  tool!: string;

  @ApiProperty({ description: 'Parameters used' })
  params!: Record<string, unknown>;

  @ApiProperty({ description: 'Whether the tool call succeeded' })
  success!: boolean;

  @ApiPropertyOptional({ description: 'Result of the tool call' })
  result?: unknown;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;
}

export class StaffCopilotResponseDto {
  @ApiProperty({ description: 'Response message to the staff' })
  response!: string;

  @ApiPropertyOptional({ description: 'Tools that were executed to fulfill the request' })
  toolsExecuted?: ToolExecution[];

  @ApiPropertyOptional({ description: 'Whether the request was denied due to permissions' })
  permissionDenied?: boolean;

  @ApiPropertyOptional({ description: 'Reason for permission denial' })
  permissionDeniedReason?: string;

  @ApiPropertyOptional({ description: 'Suggested follow-up queries' })
  suggestedFollowUps?: string[];

  @ApiPropertyOptional({ description: 'Structured data returned from tools' })
  data?: Record<string, unknown>;
}
