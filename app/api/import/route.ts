// app/api/import/route.ts
// 这个文件将在下一步编写清洗器时被替换，但目前保持原样以供占位
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // 这里的逻辑将在下一步被清洗器替换
    return NextResponse.json({ success: false, error: '数据清洗器尚未实现' }, { status: 501 });
}
